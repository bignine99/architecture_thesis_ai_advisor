from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from app.core.reviewer import get_critical_review
from app.core.guidelines import create_action_plan
from app.core.exporter import export_to_txt, export_to_pdf, export_to_docx
import os
import tempfile
import fitz  # PyMuPDF
from urllib.parse import quote

load_dotenv(override=True)

app = FastAPI(
    title="Architectural Thesis Advisor AI API",
    description="API for the AI-powered architectural thesis advisor platform.",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # React default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    text: str

class FeedbackRequest(BaseModel):
    review_text: str

class ChatRequest(BaseModel):
    message: str
    review: str
    guidelines: str
    history: list = []  # [{role, content}]

@app.get("/")
def read_root():
    return {"message": "Welcome to Architectural Thesis Advisor AI API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/v1/rag-status")
def rag_status():
    """RAG 데이터베이스 연결 상태를 반환한다. (경량 - 임베딩 API 호출 없음)"""
    import sqlite3

    _this = os.path.abspath(__file__)
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_this)))
    ref_db_path   = os.path.join(PROJECT_ROOT, "data", "chroma_db")
    bench_db_path = os.path.join(PROJECT_ROOT, "data", "chroma_benchmark")

    def count_chroma_chunks(db_path: str) -> int:
        """ChromaDB sqlite 파일에서 직접 청크 수를 조회한다. (버전 무관)"""
        sqlite_file = os.path.join(db_path, "chroma.sqlite3")
        if not os.path.exists(sqlite_file):
            # 구버전 ChromaDB: 바이너리 파일(data_level0.bin 등) 사용
            # 파일이 있으면 데이터가 있다고 간주
            hnsw_file = os.path.join(db_path, "data_level0.bin")
            if os.path.exists(hnsw_file) and os.path.getsize(hnsw_file) > 1000:
                return 999  # 구버전 → 정확한 수 불명이지만 연결됨 표시
            return -1
        try:
            conn = sqlite3.connect(sqlite_file)
            cur = conn.cursor()
            # 테이블 목록 확인 후 적절한 테이블에서 카운트
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {r[0] for r in cur.fetchall()}
            count = 0
            if "embeddings" in tables:
                cur.execute("SELECT COUNT(*) FROM embeddings")
                count = cur.fetchone()[0]
            elif "embedding_fulltext_search_content" in tables:
                cur.execute("SELECT COUNT(*) FROM embedding_fulltext_search_content")
                count = cur.fetchone()[0]
            elif tables:
                # 다른 테이블이 있으면 파일 존재로 대략 유추
                count = 1
            conn.close()
            return count
        except Exception:
            return 1  # sqlite 파일이 있으면 일단 연결됨으로 처리


    ref_exists   = os.path.exists(ref_db_path)
    bench_exists = os.path.exists(bench_db_path)

    ref_count   = count_chroma_chunks(ref_db_path)   if ref_exists   else 0
    bench_count = count_chroma_chunks(bench_db_path) if bench_exists else 0

    # 실제 청크가 1개 이상일 때만 "연결됨"으로 판정
    ref_connected   = ref_exists   and ref_count   > 0
    bench_connected = bench_exists and bench_count > 0

    return {
        "connected": ref_connected or bench_connected,
        "reference": {
            "connected": ref_connected,
            "chunk_count": max(ref_count, 0),
            "label": "참조 논문 DB (80~85점 수준)"
        },
        "benchmark": {
            "connected": bench_connected,
            "chunk_count": max(bench_count, 0),
            "label": "벤치마크 DB (실제 심사 점수)"
        }
    }


@app.get("/test-gemini")
def test_gemini():
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
        response = llm.invoke("Hello, simple test.")
        return {"response": response.content}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/upload-pdf")
async def upload_and_review_pdf(file: UploadFile = File(...)):
    """Upload a PDF thesis file, extract text, and generate review + guidelines."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        # Save uploaded file temporarily
        content = await file.read()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Extract text using PyMuPDF
        extracted_text = ""
        try:
            doc = fitz.open(tmp_path)
            total_pages = len(doc)
            for page in doc:
                extracted_text += page.get_text()
            doc.close()
        finally:
            os.unlink(tmp_path)  # Clean up temp file
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file may be image-based or empty.")
        
        # Gemini 2.5 Flash Lite: 1M 토큰 컨텍스트 지원
        # 한글 200,000자 ≈ 300,000 토큰 → 충분히 처리 가능
        # 대부분의 석·박사 논문(150~300페이지)은 잘림 없이 전문 분석
        max_chars = 200000
        if len(extracted_text) > max_chars:
            # 극단적으로 긴 경우에만 스마트 절단 (앞 80k + 중간 60k + 끝 60k)
            front = extracted_text[:80000]
            mid_start = len(extracted_text) // 2 - 30000
            middle = extracted_text[mid_start:mid_start + 60000]
            back = extracted_text[-60000:]
            extracted_text = (
                front 
                + "\n\n[... 중간 내용 일부 생략 ...]\n\n" 
                + middle 
                + "\n\n[... 중간 내용 일부 생략 ...]\n\n" 
                + back
            )
            truncated = True
        else:
            truncated = False
        
        # Step 1: Critical Review (dict: review, scores, rag_papers)
        result   = get_critical_review(extracted_text)
        review   = result.get("review", "")
        scores   = result.get("scores", {})
        rag_papers = result.get("rag_papers", [])

        # Step 2: Generate Guidelines based on Review
        guidelines = create_action_plan(review)
        
        return {
            "filename":    file.filename,
            "total_pages": total_pages,
            "text_length": len(extracted_text),
            "truncated":   truncated,
            "review":      review,
            "guidelines":  guidelines,
            "scores":      scores,
            "rag_papers":  rag_papers,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/api/v1/review")
def review_thesis_section(request: ReviewRequest):
    try:
        result = get_critical_review(request.text)
        return {"review": result.get("review", ""), "scores": result.get("scores", {})}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/chat")
async def chat_with_ai(req: ChatRequest):
    """리뷰 결과를 컨텍스트로 AI와 후속 Q&A"""
    try:
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        llm_chat = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.3,
            google_api_key=api_key,
            max_output_tokens=2048,
        )
        # 대화 이력 구성
        history_text = ""
        for h in req.history[-6:]:  # 최근 6턴만
            role = "사용자" if h.get("role") == "user" else "AI"
            history_text += f"{role}: {h.get('content','')}\n"

        prompt = f"""당신은 건축학 논문 평가 전문가 AI 어시스턴트이다.
아래 [평가 결과]는 방금 수행된 논문 평가이다. 이를 바탕으로 사용자의 질문에 구체적이고 도움이 되는 답변을 한다.
모든 답변은 '~이다', '~한다' 형식으로 작성한다.

=== 평가 결과 (요약) ===
{req.review[:3000]}

=== 개선 가이드라인 (요약) ===
{req.guidelines[:1500]}

=== 이전 대화 ===
{history_text}
===================
사용자 질문: {req.message}

전문적이고 명확한 답변을 한국어로 제공하라."""

        response = llm_chat.invoke(prompt)
        return {"response": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/guidelines")
def generate_guidelines(request: FeedbackRequest):
    try:
        plan = create_action_plan(request.review_text)
        return {"guidelines": plan}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))


class ExportRequest(BaseModel):
    review: str
    guidelines: str
    filename: str
    format: str  # "txt", "pdf", "docx"

@app.post("/api/v1/export")
def export_report(request: ExportRequest):
    """분석 결과를 TXT, PDF, DOCX 파일로 내보낸다."""
    try:
        fmt = request.format.lower()
        base_name = request.filename.rsplit('.', 1)[0] if '.' in request.filename else request.filename
        
        if fmt == "txt":
            data = export_to_txt(request.review, request.guidelines, request.filename)
            media_type = "text/plain; charset=utf-8"
            ext = "txt"
        elif fmt == "pdf":
            data = export_to_pdf(request.review, request.guidelines, request.filename)
            media_type = "application/pdf"
            ext = "pdf"
        elif fmt == "docx":
            data = export_to_docx(request.review, request.guidelines, request.filename)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ext = "docx"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}. Use txt, pdf, or docx.")
        
        export_filename = f"{base_name}_논문평가종합평.{ext}"
        encoded_filename = quote(export_filename)
        
        return Response(
            content=data,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")
