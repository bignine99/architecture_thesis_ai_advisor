"""
RAG 검색 모듈
- 기존 89개 논문 (reference, 80-85점 수준): 유사 분야 논문 검색
- 벤치마크 논문 (benchmark, 사용자 실제 심사 점수): 채점 기준 참조
"""

import os
import json
from dotenv import load_dotenv

load_dotenv(override=True)

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

# ─── 경로 설정 ───────────────────────────────────────────
# 이 파일: backend/app/core/rag_retriever.py
# PROJECT_ROOT: 프로젝트 최상위 (backend/ 의 부모)
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_THIS_DIR)))

PERSIST_DIR_REFERENCE = os.path.join(PROJECT_ROOT, "data", "chroma_db")
PERSIST_DIR_BENCHMARK = os.path.join(PROJECT_ROOT, "data", "chroma_benchmark")
BENCHMARK_META_PATH   = os.path.join(PROJECT_ROOT, "data", "benchmark_metadata.json")

# ─── 임베딩 모델 (lazy init) ─────────────────────────────
_embeddings = None
_reference_db = None
_benchmark_db = None

def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key
        )
    return _embeddings

def _get_reference_db():
    """기존 89개 논문 ChromaDB를 로드한다."""
    global _reference_db
    if _reference_db is None:
        if not os.path.exists(PERSIST_DIR_REFERENCE):
            return None
        try:
            from langchain_chroma import Chroma
            _reference_db = Chroma(
                persist_directory=PERSIST_DIR_REFERENCE,
                embedding_function=_get_embeddings()
            )
        except Exception as e:
            print(f"[RAG] Reference DB 로드 실패: {e}")
            return None
    return _reference_db

def _get_benchmark_db():
    """벤치마크 논문 ChromaDB를 로드한다."""
    global _benchmark_db
    if _benchmark_db is None:
        if not os.path.exists(PERSIST_DIR_BENCHMARK):
            return None
        try:
            from langchain_chroma import Chroma
            _benchmark_db = Chroma(
                persist_directory=PERSIST_DIR_BENCHMARK,
                embedding_function=_get_embeddings(),
                collection_name="benchmark_papers"
            )
        except Exception as e:
            print(f"[RAG] Benchmark DB 로드 실패: {e}")
            return None
    return _benchmark_db


def _deduplicate_by_title(docs: list) -> list:
    """동일 제목의 문서를 중복 제거하고 논문 단위로 대표 문서를 반환한다."""
    seen_titles = {}
    for doc in docs:
        title = doc.metadata.get("source", doc.metadata.get("title", "unknown"))
        # 파일명만 추출 (경로 제거)
        title = os.path.basename(title) if os.path.sep in title else title
        if title not in seen_titles:
            seen_titles[title] = doc
    return list(seen_titles.values())


def retrieve_reference_context(query_text: str, top_k: int = 5) -> str:
    """
    기존 89개 논문(80-85점 수준)에서 유사 논문을 검색하여
    컨텍스트 문자열을 반환한다.
    """
    db = _get_reference_db()
    if db is None:
        return ""

    try:
        # 쿼리: 평가 논문의 앞 3000자 사용 (핵심 주제 파악)
        query = query_text[:3000]
        results = db.similarity_search(query, k=top_k * 3)  # 중복 제거 여유분

        # 논문 단위로 중복 제거
        unique_docs = _deduplicate_by_title(results)[:top_k]

        if not unique_docs:
            return ""

        lines = [
            "=== 유사 분야 참조 논문 (80~85점 수준, 동등 기준선) ===",
            "아래는 해당 분야에서 80~85점 수준으로 평가된 논문들이다.",
            "이 논문들이 이 분야의 '표준' 수준이며, 평가 논문이 이보다 낫거나 못한지 비교하라.",
            ""
        ]
        for i, doc in enumerate(unique_docs, 1):
            src = doc.metadata.get("source", "알 수 없음")
            title = os.path.basename(src).replace(".pdf", "") if src else "알 수 없음"
            content_preview = doc.page_content[:400].replace("\n", " ").strip()
            lines.append(f"[참조 논문 {i}] 제목: {title}")
            lines.append(f"  수준: 80~85점 (이 분야 표준 수준)")
            lines.append(f"  내용 발췌: {content_preview}...")
            lines.append("")

        lines.append("=" * 50)
        return "\n".join(lines)

    except Exception as e:
        print(f"[RAG] Reference 검색 오류: {e}")
        return ""


def retrieve_benchmark_context(query_text: str, top_k: int = 3) -> str:
    """
    사용자가 직접 심사한 벤치마크 논문에서 유사 논문을 검색하여
    실제 채점 기준 컨텍스트를 반환한다.
    """
    db = _get_benchmark_db()
    if db is None:
        return ""

    try:
        query = query_text[:3000]
        results = db.similarity_search(query, k=top_k * 3)

        unique_docs = _deduplicate_by_title(results)[:top_k]

        if not unique_docs:
            return ""

        lines = [
            "=== 실제 심사 벤치마크 논문 (심사자 직접 채점 기준) ===",
            "아래는 동일 심사자가 직접 채점한 논문이다. 이 점수를 채점 기준점(anchor)으로 활용하라.",
            ""
        ]
        for i, doc in enumerate(unique_docs, 1):
            m = doc.metadata
            title = m.get("title", os.path.basename(m.get("source", "알 수 없음")))
            score = m.get("user_score", "?")
            decision = m.get("review_decision", "?")
            notes = m.get("reviewer_notes", "")
            score_A = m.get("score_A", "?")
            score_B = m.get("score_B", "?")
            score_C = m.get("score_C", "?")
            score_D = m.get("score_D", "?")
            content_preview = doc.page_content[:300].replace("\n", " ").strip()
            field = m.get("field", "건축")

            lines.append(f"[벤치마크 논문 {i}]")
            lines.append(f"  제목: {title}")
            lines.append(f"  분야: {field}")
            lines.append(f"  총점: {score}점 | 심사결과: {decision}")
            lines.append(f"  영역별 점수: A(논리성)={score_A} / B(체계성)={score_B} / C(독창성)={score_C} / D(반증성)={score_D}")
            lines.append(f"  심사자 메모: {notes}")
            lines.append(f"  내용 발췌: {content_preview}...")
            lines.append("")

        lines.append("=" * 50)
        return "\n".join(lines)

    except Exception as e:
        print(f"[RAG] Benchmark 검색 오류: {e}")
        return ""


def get_referenced_papers(text: str) -> list:
    """
    프론트엔드 RAG 패널용: 실제 검색된 논문 메타데이터 목록을 반환한다.
    [{ type, title, score_range, score, decision, notes, similarity_rank }]
    """
    papers = []
    query  = text[:3000]

    # Reference papers
    ref_db = _get_reference_db()
    if ref_db:
        try:
            results = ref_db.similarity_search(query, k=12)
            unique  = _deduplicate_by_title(results)[:5]
            for i, doc in enumerate(unique, 1):
                src   = doc.metadata.get("source", "")
                title = os.path.basename(src).replace(".pdf", "") if src else "알 수 없음"
                papers.append({
                    "type":         "reference",
                    "title":        title,
                    "score_range":  "80~85점",
                    "score":        None,
                    "decision":     "통과 수준",
                    "notes":        "표준 기준선 논문",
                    "rank":         i,
                })
        except Exception as e:
            print(f"[RAG] Referenced papers (ref) error: {e}")

    # Benchmark papers
    bench_db = _get_benchmark_db()
    if bench_db:
        try:
            results = bench_db.similarity_search(query, k=9)
            unique  = _deduplicate_by_title(results)[:3]
            for i, doc in enumerate(unique, 1):
                m = doc.metadata
                papers.append({
                    "type":        "benchmark",
                    "title":       m.get("title", "알 수 없음"),
                    "score_range": m.get("score_range_label", "심사 기준"),
                    "score":       m.get("user_score"),
                    "decision":    m.get("review_decision", "—"),
                    "notes":       m.get("reviewer_notes", ""),
                    "rank":        i,
                })
        except Exception as e:
            print(f"[RAG] Referenced papers (bench) error: {e}")

    return papers


def get_full_rag_context(text: str) -> str:
    """
    평가 논문 텍스트를 받아 전체 RAG 컨텍스트를 반환한다.
    reference + benchmark 컨텍스트를 합친다.
    """
    ref_context = retrieve_reference_context(text, top_k=4)
    bench_context = retrieve_benchmark_context(text, top_k=2)

    parts = []
    if ref_context:
        parts.append(ref_context)
    if bench_context:
        parts.append(bench_context)

    if not parts:
        return ""

    header = (
        "\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "## 📚 RAG 참조 컨텍스트 (채점 기준점)\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "이 정보는 평가 논문과 유사한 기존 논문들의 수준 정보이다.\n"
        "채점 시 이 정보를 반드시 참조하여 상대적 수준을 판단하라.\n\n"
    )
    footer = "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

    return header + "\n\n".join(parts) + footer
