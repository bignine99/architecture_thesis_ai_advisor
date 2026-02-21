# 건축설계 논문 지도교수 AI (Architectural Thesis Advisor AI) 프로그램 설명서

## 1. 프로그램 개요 (Overview)
**Architectural Thesis Advisor AI**는 건축학 및 건축공학 전공 학생들의 설계 논문 작성 전 과정을 보조하고, 지도교수의 반복적인 업무 부담을 최소화하기 위해 개발된 **AI 기반 논문 지도 자동화 웹 플랫폼**입니다.

검증된 우수 논문 데이터를 학습한 AI가 학생의 논문 초안을 분석하여 **지도교수 수준의 비평(Critical Review)**과 **구체적인 수정 가이드라인(Actionable Guidelines)**을 실시간으로 제공합니다.

---

## 2. 핵심 기능 (Core Features)

### 2.1. Reference RAG (Retrieval-Augmented Generation) 엔진
- **기능**: 기 검증된 우수 건축설계 논문 및 관련 법규 데이터를 벡터 데이터베이스(ChromaDB)에 저장하여 관리합니다.
- **작동 방식**: 학생이 논문을 업로드하면, 현재 논문의 문맥과 가장 유사한 우수 사례나 이론적 근거를 검색하여 피드백 생성 시 참고 자료로 활용합니다.
- **사용 모델**: Google `models/text-embedding-004`

### 2.2. AI Critical Reviewer (비평가 모듈)
- **기능**: 논문의 논리적 흐름, 근거의 타당성, 학술적 표현의 적절성을 평가합니다.
- **상세 평가 항목**:
  - **Logic & Coherence**: 논리 전개와 구조적 완결성
  - **Evidence**: 주장을 뒷받침하는 데이터 및 사례의 충분성
  - **Technical Accuracy**: 건축 전문 용어 및 개념 사용의 정확성
- **출력**: 강점(Strengths), 약점(Weaknesses), 구체적 개선점(Specific Recommendations)

### 2.3. Intelligent Guideline Generator (가이드 생성 모듈)
- **기능**: 비평 결과를 바탕으로 학생이 즉시 수행해야 할 과제를 생성합니다.
- **구성**:
  - **Immediate Action Items**: 오늘~내일 중으로 해결해야 할 긴급 수정 사항
  - **Short-term Goals**: 이번 주 내로 달성해야 할 목표
  - **Specific Revisions**: 챕터별 구체적 수정 지시 사항

### 2.4. 사용자 인터페이스 (User Interface)
- **Dashboard**: 미니멀하고 전문적인 다크 모드 UI
- **Dual-Pane View**: 왼쪽에는 AI의 비평, 오른쪽에는 구체적 실행 과제를 나란히 보여주어 가독성 극대화
- **Markdown Support**: 논문 초안의 구조(헤더, 리스트 등)를 유지하며 분석 가능

---

## 3. 기술 스택 (Technology Stack)

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark Mode optimized)
- **Animation**: Framer Motion
- **Networking**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **API Spec**: RESTful API (`/api/v1/review`, `/api/v1/guidelines`)

### AI & Data
- **LLM**: Google Gemini (`gemini-2.0-flash-lite`)
- **Embedding**: Google Generative AI Embeddings (`models/text-embedding-004`)
- **Orchestration**: LangChain
- **Vector DB**: ChromaDB
- **PDF Processing**: PyMuPDF

---

## 4. 설치 및 실행 방법 (Installation & Run)

### 사전 요구 사항
- Python 3.8 이상
- Node.js 16 이상
- Google Gemini API Key

### 설치 (Installation)
프로젝트 루트 디렉토리에서 제공된 설정 스크립트를 실행합니다.
```bash
setup_project.bat
```
이 스크립트는 백엔드 가상환경(venv) 생성, 라이브러리 설치, 프론트엔드 의존성 설치를 자동으로 수행합니다.

### 실행 (Run)
두 개의 터미널을 열어 각각 실행합니다.

**Terminal 1 (Backend)**
```bash
cd backend
venv\Scripts\activate
# 의존성 모듈 로드 오류 방지를 위해 python 모듈로 실행 권장
python -m uvicorn app.main:app
```

**Terminal 2 (Frontend)**
```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하여 사용합니다.
