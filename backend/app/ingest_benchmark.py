"""
벤치마크 논문 RAG 인제스트 스크립트
- 사용자가 직접 심사한 4개 논문을 별도 ChromaDB 컬렉션에 저장
- 논문 제목, 점수, 심사 메모를 메타데이터로 포함
- 실행: backend 디렉토리에서 venv 활성화 후
    python ingest_benchmark.py
"""

import os
import json
import sys

# Windows cmd cp949 환경에서 UTF-8 출력 강제
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from dotenv import load_dotenv

load_dotenv(override=True)

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY in .env")

from langchain_chroma import Chroma
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

# ─── 경로 설정 ───────────────────────────────────────────
# ingest_benchmark.py 위치: backend/app/ingest_benchmark.py
# dirname x1 = backend/app/  → dirname x2 = backend/  → dirname x3 = 프로젝트 루트
_THIS_FILE = os.path.abspath(__file__)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_THIS_FILE)))
BENCHMARK_META = os.path.join(PROJECT_ROOT, "data", "benchmark_metadata.json")
PERSIST_DIR_BENCHMARK = os.path.join(PROJECT_ROOT, "data", "chroma_benchmark")  # 새 벤치마크 DB

print(f"[경로] PROJECT_ROOT: {PROJECT_ROOT}")
print(f"[경로] BENCHMARK_META: {BENCHMARK_META}")

# ─── 임베딩 모델 설정 ─────────────────────────────────────
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=api_key
)

def load_benchmark_metadata() -> list:
    """benchmark_metadata.json 파일을 로드한다."""
    if not os.path.exists(BENCHMARK_META):
        print(f"ERROR: benchmark_metadata.json not found at {BENCHMARK_META}")
        return []
    with open(BENCHMARK_META, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

def validate_metadata(meta: dict) -> bool:
    """메타데이터 유효성을 검사한다."""
    if meta.get("user_score", 0) == 0:
        print(f"  WARNING: '{meta['title']}' 의 점수가 0점입니다. benchmark_metadata.json을 수정하세요.")
        return False
    pdf_path = os.path.join(PROJECT_ROOT, meta["pdf_path"])
    if not os.path.exists(pdf_path):
        print(f"  WARNING: PDF not found: {pdf_path}")
        print(f"           data/benchmark/ 폴더에 논문 PDF를 넣어주세요.")
        return False
    return True

def ingest_benchmark_papers():
    """사용자 심사 기준 논문을 ChromaDB 벤치마크 컬렉션에 저장한다."""
    print("=" * 60)
    print("  벤치마크 논문 RAG 인제스트 시작")
    print("=" * 60)

    benchmarks = load_benchmark_metadata()
    if not benchmarks:
        print("ERROR: 메타데이터가 없습니다.")
        return

    valid_items = []
    print(f"\n총 {len(benchmarks)}개 논문 검증 중...")
    for item in benchmarks:
        print(f"\n  [{item['id']}] {item['title']}")
        print(f"       점수: {item['user_score']}점 | 심사결과: {item['review_decision']}")
        if validate_metadata(item):
            valid_items.append(item)
            print(f"       [OK] 유효")
        else:
            print(f"       [SKIP] 건너뜀")

    if not valid_items:
        print("\n유효한 벤치마크 논문이 없습니다. benchmark_metadata.json을 수정해주세요.")
        return

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )

    all_docs = []
    print(f"\n{len(valid_items)}개 논문 처리 중...")

    for item in valid_items:
        pdf_path = os.path.join(PROJECT_ROOT, item["pdf_path"])
        try:
            loader = PyMuPDFLoader(pdf_path)
            raw_docs = loader.load()
            print(f"  [{item['id']}] {len(raw_docs)}페이지 로드 완료")

            # 청킹
            chunks = text_splitter.split_documents(raw_docs)

            # 각 청크에 벤치마크 메타데이터 추가
            for chunk in chunks:
                chunk.metadata.update({
                    "type": "benchmark",
                    "benchmark_id": item["id"],
                    "title": item["title"],
                    "user_score": str(item["user_score"]),
                    "score_A": str(item["score_breakdown"].get("A_논리성및담론", 0)),
                    "score_B": str(item["score_breakdown"].get("B_체계성및방법론", 0)),
                    "score_C": str(item["score_breakdown"].get("C_독창성및기여", 0)),
                    "score_D": str(item["score_breakdown"].get("D_반증성및한계", 0)),
                    "review_decision": item["review_decision"],
                    "reviewer_notes": item["reviewer_notes"],
                    "field": item["field"],
                    "score_range_label": item.get("score_range_label", ""),
                })
            all_docs.extend(chunks)
            print(f"       → {len(chunks)}개 청크 생성")

        except Exception as e:
            print(f"  ERROR loading [{item['id']}]: {e}")

    if not all_docs:
        print("처리된 문서가 없습니다.")
        return

    print(f"\n총 {len(all_docs)}개 청크 → ChromaDB 저장 중...")

    batch_size = 50
    vectorstore = None
    total_batches = (len(all_docs) - 1) // batch_size + 1

    for i in range(0, len(all_docs), batch_size):
        batch = all_docs[i:i + batch_size]
        batch_num = i // batch_size + 1
        try:
            if vectorstore is None:
                vectorstore = Chroma.from_documents(
                    documents=batch,
                    embedding=embeddings,
                    persist_directory=PERSIST_DIR_BENCHMARK,
                    collection_name="benchmark_papers"
                )
            else:
                vectorstore.add_documents(batch)
            print(f"  Batch {batch_num}/{total_batches} 완료 ({len(batch)} chunks)")
        except Exception as e:
            print(f"  ERROR Batch {batch_num}: {e}")
            if vectorstore is None:
                print("FATAL: 첫 번째 배치 실패. 중단.")
                return

    print("\n" + "=" * 60)
    print("  [DONE] 벤치마크 RAG 인제스트 완료!")
    print(f"  저장 위치: {PERSIST_DIR_BENCHMARK}")
    print(f"  저장 논문: {len(valid_items)}편")
    print(f"  총 청크 수: {len(all_docs)}개")
    print("=" * 60)

if __name__ == "__main__":
    ingest_benchmark_papers()
