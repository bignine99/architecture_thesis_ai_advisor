import re
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv(override=True)

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.1,
    google_api_key=api_key,
)

try:
    from app.core.rag_retriever import get_full_rag_context, get_referenced_papers
    RAG_ENABLED = True
except ImportError:
    RAG_ENABLED = False
    def get_full_rag_context(text: str) -> str: return ""
    def get_referenced_papers(text: str) -> list: return []


# ─── Phase 1: Observation Template ───────────────────────────
OBSERVATION_TEMPLATE = """당신은 건축학 논문 심사 전문가이다.
제출된 논문 텍스트에서 아래 50개 체크리스트 항목을 **사실 확인** 방식으로 관찰하라.
가치 판단이나 점수는 지금 매기지 말고, 오직 **있음/없음/부분적**과 그 근거(문장/페이지 인용)만 기술하라.
모든 답변은 '~이다', '~한다' 형식으로 작성한다.
{rag_context}

=== 논문 전문 ===
{text}
================

## 관찰 체크리스트 (사실 확인)

### 영역 A: 논리성 및 담론 (15항목)
A1. 명확한 연구 질문이 제시되어 있는가?
A2. 논문의 주장(Thesis Statement/가설)이 명시적으로 기술되어 있는가?
A3. 연구 질문과 주장의 논리적 연결이 타당한가?
A4. 선행 연구 검토가 체계적으로 이루어졌는가?
A5. 선행 연구와 본 연구의 차별점이 명확히 제시되어 있는가?
A6. 핵심 개념의 정의가 명확한가?
A7. 이론적 틀(Theoretical Framework)이 제시되어 있는가?
A8. 다학제적 또는 비교 담론이 통합되어 있는가?
A9. 논거와 증거의 일관성이 있는가?
A10. 논리적 비약이나 순환 논리가 없는가?
A11. 결론이 서론의 질문에 직접적으로 답하는가?
A12. 건축사/이론/비평적 맥락이 적절히 활용되었는가?
A13. 참고문헌의 학술적 신뢰성이 있는가?
A14. 다양한 시각/반론이 균형 있게 검토되었는가?
A15. 논문의 논의가 건축 실천 혹은 학문에 기여하는 방향으로 전개되는가?

### 영역 B: 체계성 및 방법론 (15항목)
B1. 연구 방법론이 명확히 기술되어 있는가?
B2. 연구 방법이 연구 질문에 적합한가?
B3. 사례 연구나 분석 대상의 선정 기준이 설명되어 있는가?
B4. 분석 프레임워크가 일관되게 적용되고 있는가?
B5. 자료 수집 방법(현장조사, 아카이브, 인터뷰 등)이 명시되어 있는가?
B6. 연구의 범위와 한계가 설정되어 있는가?
B7. 논문 구조(장 구성)가 논리적으로 전개되는가?
B8. 시각자료(도면, 사진, 다이어그램)가 텍스트 논의를 효과적으로 지원하는가?
B9. 출처 표기(각주/미주/참고문헌)가 일관된 양식으로 되어 있는가?
B10. 연구 과정이 재현 가능하도록 충분히 기술되어 있는가?
B11. 분석 데이터나 자료가 논거를 충분히 뒷받침하는가?
B12. 용어의 일관성이 유지되고 있는가?
B13. Abstract가 논문 내용을 적절히 요약하고 있는가?
B14. 키워드가 연구 내용을 적절히 반영하는가?
B15. 전체 분량이 연구 주제의 복잡성에 적합한가?

### 영역 C: 독창성 및 기여 (10항목)
C1. 기존 연구에 없는 새로운 시각이나 발견이 있는가?
C2. 새로운 개념, 유형론, 분석 틀을 제시하는가?
C3. 연구 결과가 건축 담론에 새로운 기여를 하는가?
C4. 창의적이거나 혁신적인 방법론이 활용되었는가?
C5. 사례 연구가 독창적이거나 미발굴 자료를 활용하는가?
C6. 결론에서 미래 연구 방향이나 실천적 제언이 제시되는가?
C7. 학제 간 융합이나 새로운 비교 관점이 도입되었는가?
C8. 기존 이론의 확장이나 비판적 재해석이 이루어지는가?
C9. 지역·문화적 맥락에서 새로운 건축 지식을 생산하는가?
C10. 연구 주제의 시의성과 현실 적합성이 인정되는가?

### 영역 D: 반증성 및 한계 (10항목)
D1. 연구의 한계와 제약이 솔직하게 기술되어 있는가?
D2. 반론 가능성이나 대안적 해석이 검토되어 있는가?
D3. 일반화의 한계가 인식되고 있는가?
D4. 방법론의 약점이나 가정이 명시되어 있는가?
D5. 자료나 사례의 대표성 문제가 다루어지는가?
D6. 주관적 해석에 대한 성찰이 이루어지는가?
D7. 연구 외부 변수나 맥락적 제약이 고려되는가?
D8. 결론의 잠정성(provisional nature)이 인식되는가?
D9. 후속 연구를 위한 미해결 과제가 제시되는가?
D10. 윤리적 고려사항(저작권, 사생활 등)이 다루어지는가?

각 항목별로: **[있음/부분/없음]** + 구체적 근거 (1~2문장)"""


# ─── Phase 2: Scoring Template ───────────────────────────────
SCORING_TEMPLATE = """당신은 건축학 논문 심사 전문가이다. 아래의 [관찰 결과]는 동일 논문에 대해 이미 수행된 사실 확인이다.
이 관찰 결과만을 근거로 점수를 부여하고, 논문 평가 종합평을 작성하라.
추측이나 새로운 판단을 추가하지 말고, 오직 관찰된 사실에 근거하여 채점하라.
모든 답변은 '~이다', '~한다' 형식으로 작성한다.
{rag_context}

=== 관찰 결과 ===
{observations}
==================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ★ 채점 규칙 (반드시 준수) ★

### 규칙 1: 항목별 채점 기준 (3점 척도)
- **3점 (우수)**: 해당 항목이 높은 완성도로 수행됨.
- **2점 (양호)**: 해당 항목이 확인되며 기본 수준 이상으로 수행됨.
- **1점 (미흡)**: 시도는 있으나 불완전하거나, 표면적 수준에 그침.
- **0점 (미충족)**: 해당 내용이 전혀 없거나 심각하게 부족함.
- **해당없음**: 논문 유형상 적용 불가능한 항목 → 배점에서 제외.

### 규칙 2: 영역별 환산법
- 영역 A: 15항목 × 3점 = 45점 만점 → 30점으로 환산
- 영역 B: 15항목 × 3점 = 45점 만점 → 30점으로 환산
- 영역 C: 10항목 × 3점 = 30점 만점 → 20점으로 환산
- 영역 D: 10항목 × 3점 = 30점 만점 → 20점으로 환산

### 규칙 3: 영역 D (반증성 및 한계) 특별 지침 ★ 필수 ★
건축설계 논문은 실증과학과 달리 반증 가능성의 공식적 제시가 구조적으로 어렵다.
따라서 영역 D 채점 시 아래 기준을 반드시 적용한다:
- 건축설계 논문에서 D1~D10 항목은 "설계 개념의 한계 인식", "맥락적 적용 범위 제한", 
  "대안적 해석 가능성 언급" 등 **설계적 방식의 자기성찰**로도 충족 가능하다.
- 한계나 반론이 명시적으로 기술되지 않더라도, 논문의 논의 구조 속에
  암묵적으로 내포된 경우 **부분 인정(1~2점)**을 부여한다.
- 영역 D의 최저 환산 점수는 **8점** 이상이 되도록 한다
  (단, 관찰 결과에서 한계나 자기성찰이 전혀 없는 경우는 예외).
- D 영역이 낮다는 이유만으로 최종 등급을 과도하게 낮추지 않는다.

### 규칙 4: 심사 결과 판정
- **85~100점**: 수정 후 조건부 통과
- **70~84점**: 수정 후 재심
- **51~69점**: 대폭적 수정 후 재심
- **0~50점**: 평가 불가
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 논문 평가 종합평

### 1. 총평
(논문의 전체 수준에 대한 종합 평가를 3~5문장으로 작성한다.)

### 2. 종합 점수 및 심사 결과

| 평가 영역 | 해당 항목 | 획득/만점 | 환산 점수 |
|-----------|----------|-----------|----------|
| A. 논리성 및 담론 | __/15개 | __/__ | __/30 |
| B. 체계성 및 방법론 | __/15개 | __/__ | __/30 |
| C. 독창성 및 기여 | __/10개 | __/__ | __/20 |
| D. 반증성 및 한계 | __/10개 | __/__ | __/20 |
| **총점** | | | **__/100** |

**심사 결과: [결과명]**

### 3. 논문의 주요 강점
(특히 잘 수행된 3~5가지를 구체적으로 서술한다.)

### 4. 영역별 세부 평가

항목 코드(A1, A2 등)는 절대 표기하지 않는다. 자연스러운 문장으로만 서술한다.

#### 영역 A: 논리성 및 담론 (환산 __/30)

#### 영역 B: 체계성 및 방법론 (환산 __/30)

#### 영역 C: 독창성 및 기여 (환산 __/20)

#### 영역 D: 반증성 및 한계 (환산 __/20)

### 5. 핵심 개선 사항

### 6. 논증 강화 제안

### 7. 종합 의견

---
[필수] 보고서 맨 마지막 줄에 아래 형식으로 점수를 반드시 출력하라 (숫자만 기입):
[점수집계:A=숫자,B=숫자,C=숫자,D=숫자,총점=숫자]
실제 작성 예시: [점수집계:A=22,B=18,C=15,D=12,총점=67]
"""


observation_prompt = PromptTemplate.from_template(OBSERVATION_TEMPLATE)
scoring_prompt     = PromptTemplate.from_template(SCORING_TEMPLATE)


# ─── Score Parser ─────────────────────────────────────────────
def _parse_scores(report: str) -> dict:
    """보고서 텍스트에서 구조화 점수를 파싱한다. (다중 패턴 fallback)"""

    # ── 1순위: 명시적 집계 태그 (공백·개행 허용) ────────────
    m = re.search(
        r'\[점수집계\s*:\s*A\s*=\s*(\d+)\s*,\s*B\s*=\s*(\d+)\s*,\s*C\s*=\s*(\d+)\s*,\s*D\s*=\s*(\d+)\s*,\s*총점\s*=\s*(\d+)\s*\]',
        report
    )
    if m:
        return {
            "A":     min(int(m.group(1)), 30),
            "B":     min(int(m.group(2)), 30),
            "C":     min(int(m.group(3)), 20),
            "D":     min(int(m.group(4)), 20),
            "total": min(int(m.group(5)), 100),
        }

    # ── 2순위: 점수 표 행에서 환산값 추출 ────────────────────
    scores: dict = {}
    for domain, max_s in [("A", 30), ("B", 30), ("C", 20), ("D", 20)]:
        # 표 행: | A. xxx | n/15개 | n/45 | 22/30 |
        pat1 = rf'\|\s*{domain}[^\|]{{1,40}}\|[^\|]{{1,20}}\|[^\|]{{1,20}}\|\s*(\d+)\s*/\s*{max_s}\s*\|'
        # 인라인: (환산 22/30) 또는 영역A ... 22/30
        pat2 = rf'영역\s*{domain}[^\n]{{0,80}}(\d+)\s*/\s*{max_s}'
        # 마지막 수단: 텍스트 내 숫자/max 패턴
        pat3 = rf'(\d+)\s*/\s*{max_s}\b'

        found = None
        for pat in [pat1, pat2, pat3]:
            ms = re.findall(pat, report, re.MULTILINE)
            if ms:
                raw = ms[-1]
                found = int(raw if isinstance(raw, str) else raw[-1])
                break
        scores[domain] = min(found or 0, max_s)

    # 총점 (다양한 표현 허용)
    tm = re.search(r'(?:총점|Total)[^\d]{0,20}(\d{2,3})\s*/\s*100', report, re.IGNORECASE)
    total = int(tm.group(1)) if tm else sum(scores.values())
    scores["total"] = min(total, 100)

    # 모두 0이면 파싱 실패로 간주
    if all(v == 0 for v in scores.values()):
        return {}
    return scores


def _clean_report(report: str) -> str:
    """집계 태그를 보고서 표시용 텍스트에서 제거한다."""
    cleaned = re.sub(r'\[필수\][^\n]*\n?', '', report)
    cleaned = re.sub(r'\[점수집계:[^\]]+\]', '', cleaned)
    return cleaned.strip()


def get_critical_review(text: str) -> dict:
    """2단계 분리 평가. dict 반환: {review, scores, rag_papers}"""
    observation_chain = observation_prompt | llm | StrOutputParser()
    scoring_chain     = scoring_prompt     | llm | StrOutputParser()

    try:
        # RAG context + referenced papers
        rag_context = get_full_rag_context(text) if RAG_ENABLED else ""
        rag_papers  = get_referenced_papers(text) if RAG_ENABLED else []

        # Phase 1: Observation
        observations = observation_chain.invoke({
            "text":        text,
            "rag_context": rag_context,
        })

        # Phase 2: Scoring (rag_context만 사용, text는 넘기지 않음)
        report_raw = scoring_chain.invoke({
            "observations": observations,
            "rag_context":  rag_context,
        })

        scores = _parse_scores(report_raw)
        review = _clean_report(report_raw)

        return {"review": review, "scores": scores, "rag_papers": rag_papers}

    except Exception as e:
        return {
            "review":     f"리뷰 생성 오류: {str(e)}",
            "scores":     {},
            "rag_papers": [],
        }
