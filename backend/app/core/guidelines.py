
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# Force .env to override system environment variables
load_dotenv(override=True)
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.0,
    google_api_key=api_key,
    max_output_tokens=8192,
)

TASK_TEMPLATE = """당신은 건축학 박사논문 지도교수이자 논문 수정 전략가이다.
아래의 논문 평가 종합평을 분석하여, 연구자가 즉시 실행할 수 있는 구체적인 수정 및 보강 과제를 한국어로 작성하라.
모든 답변은 보고서 형식인 '~이다', '~한다'로 작성한다.

=== 논문 평가 종합평 ===
{review_text}
====================

아래 형식에 따라 실행 과제를 작성하라:

### 📋 수정 우선순위 매트릭스

| 우선순위 | 과제 | 영역 | 예상 소요 시간 | 영향도 |
|---------|------|------|---------------|--------|
| 1 (긴급) | [과제명] | [A/B/C/D 영역] | [시간] | [상/중/하] |
| 2 | [과제명] | [영역] | [시간] | [영향도] |
| ... | ... | ... | ... | ... |

### 🔴 즉시 실행 항목 (1~3일 내)
(비평에서 지적된 가장 심각한 논리적 결함, 구조적 문제를 해결하기 위한 구체적인 작업을 나열한다.)
1. **[과제명]**: [구체적 실행 방법 및 기대 효과를 2~3문장으로 설명한다]
2. **[과제명]**: [설명]

### 🟡 단기 목표 (1주 내)
(방법론 보강, 시각 자료 개선, 참고문헌 보완 등 체계성 향상을 위한 과제를 나열한다.)
1. **[과제명]**: [설명]
2. **[과제명]**: [설명]

### 🟢 중기 목표 (2~4주)
(독창성 강화, 반증성 보완, 논증 구조 재편 등 논문의 질적 도약을 위한 과제를 나열한다.)
1. **[과제명]**: [설명]
2. **[과제명]**: [설명]

### 📖 추천 참고 자료 및 이론적 보강 방향
(비평에서 부족하다고 지적된 영역을 보강하기 위한 구체적 참고문헌, 이론, 방법론을 제안한다.)
- **[분야/주제]**: [구체적 자료명 또는 연구 방향]
- **[분야/주제]**: [자료명 또는 방향]

### 📊 영역별 개선 전략
(비평의 4개 영역(A: 논리성, B: 체계성, C: 독창성, D: 반증성) 각각에 대해 점수를 끌어올리기 위한 핵심 전략을 1~2문장씩 제시한다.)

| 영역 | 현재 수준 | 개선 전략 |
|------|----------|-----------|
| A. 논리성 및 담론 | [현 수준 요약] | [전략] |
| B. 체계성 및 방법론 | [현 수준 요약] | [전략] |
| C. 독창성 및 기여 | [현 수준 요약] | [전략] |
| D. 반증성 및 한계 | [현 수준 요약] | [전략] |

### 💡 최종 조언
(연구자에게 전하는 지도교수로서의 종합적 조언을 3~5문장으로 작성한다. 논문의 강점을 살리면서 약점을 보완하는 방향성을 제시한다.)
"""

guideline_prompt = PromptTemplate.from_template(TASK_TEMPLATE)

def create_action_plan(review_text: str) -> str:
    """논문 평가 종합평 기반 실행 과제를 생성한다."""
    chain = guideline_prompt | llm | StrOutputParser()
    try:
        response = chain.invoke({"review_text": review_text})
        return response
    except Exception as e:
        return f"실행 과제 생성 오류: {str(e)}"
