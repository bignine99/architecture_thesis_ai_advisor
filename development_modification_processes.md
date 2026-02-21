# 건축설계 논문 지도교수 AI 개발 및 수정 일지 (Development & Modification Process)

**프로젝트**: Architectural Thesis Advisor AI
**개발 단계**: Phase 0 ~ Phase 7 (핵심 기능 완성)
**주요 모델**: `gemini-2.5-flash-lite` (temperature=0.0)
**최종 수정일**: 2026-02-20

---

## 📅 개발 이력

### Phase 0: 프로젝트 초기 설정 (2026-02-19)
- **기획**: 건축설계 논문 지도를 위한 AI 시스템 아키텍처 수립
- **디렉토리 구조**: `frontend`(React+Vite), `backend`(FastAPI), `data`(PDFs)로 분할
- **자동 설정 스크립트**: `setup_project.bat`을 제작하여 Python 가상환경(venv) 생성 및 npm 의존성 설치 자동화

### Phase 1: 데이터 관리 및 RAG 구축 시도 (2026-02-19)
- **PDF 정리 스크립트**: `.raw_data` 폴더의 논문들을 `data/pdfs`로 안전하게 이동 및 구조화
- **Ingestion Script**: `ingest_data.py`를 통해 PDF 텍스트 추출, 청킹, 임베딩 시도
- **전환**: 임베딩 모델을 OpenAI에서 Google Gemini (`models/text-embedding-004`)로 변경

### Phase 2: AI 코어 로직 구현 (2026-02-19)
- **Critical Reviewer**: `reviewer.py` 모듈 개발. 논문 평가 LLM 프롬프트 설계
- **Guideline Generator**: `guidelines.py` 모듈 개발. 평가 결과를 실행 과제로 변환
- **FastAPI Endpoint**: `/api/v1/review`, `/api/v1/guidelines` API 추가 및 CORS 설정

### Phase 3: 프론트엔드 개발 (2026-02-19)
- **UI Framework**: React + Tailwind CSS + Framer Motion 도입
- **FileUpload Component**: 드래그 앤 드롭 인터페이스 구현
- **Analysis View**: 좌우 분할 레이아웃 → 이후 세로 적층형으로 변경
- **API Client**: Axios를 활용한 백엔드 통신 모듈 구축

### Phase 4: 디버깅 및 환경 해결 (2026-02-19)
- ModuleNotFoundError 해결: `python -m uvicorn` 실행 방식 전환
- API Key 충돌 해결: `load_dotenv(override=True)` 적용
- 모델명 통일: `gemini-2.5-flash-lite`로 전환

---

### Phase 5: AI 리뷰어 고도화 (2026-02-20)

#### 5-1. Critical Peer Reviewer 프롬프트 설계
- `docs/Critical Peer Reviewer_ai_prompt.txt` 기반의 전문가 페르소나 구현
- 50개 체크리스트 항목 (A~D 영역) 설계
- Toulmin 논증 모델 기반 분석 도입

#### 5-2. 평가 일관성 문제 발견 및 해결
- **문제 1**: 동일 논문의 점수가 매번 다름 (60 → 40 → 42)
  - **원인**: temperature=0.3의 랜덤성
  - **해결**: `temperature=0.0` 설정 (결정론적 출력)

- **문제 2**: 모든 논문이 지나치게 낮은 점수 (40~50점대)
  - **원인**: "가차 없이 비판" 톤 + 해당없는 항목도 감점
  - **해결**: 해당없음 항목 배점 제외, 비율 환산, 균형 잡힌 톤

- **문제 3**: 잘 쓴 논문이 오히려 더 낮은 점수를 받는 역전 현상
  - **원인**: ① 텍스트 절단(앞 50,000자만 사용 → 결론 부분 소실), ② 단일 패스 평가의 불안정성, ③ 복잡한 논문에 더 많은 결함 발견 편향
  - **해결**: 2단계 분리 평가 시스템 도입

#### 5-3. 2단계 분리 평가 시스템 (Phase 1 → Phase 2)
```
[텍스트 입력]
    ↓
Phase 1 (관찰): 50개 항목에 대해 "확인됨/부분확인/미확인/해당없음" + 근거만 기록
    ↓ (편견 없는 사실 수집)
Phase 2 (채점): Phase 1의 관찰 결과만을 근거로 점수 산출 + 보고서 작성
    ↓ (증거 기반 채점)
[논문 평가 종합평 출력]
```

#### 5-4. 스마트 텍스트 추출
- **이전**: 앞 50,000자만 사용 → 결론/한계 부분 소실
- **수정**: 200,000자 제한 (Gemini 2.5의 1M 토큰 컨텍스트 활용)
- 200,000자 초과 시에만 스마트 절단: 앞 80k + 중간 60k + 끝 60k

#### 5-5. 채점 척도 및 심사 결과 체계
- **채점 척도**: 2점 → 3점 척도로 확대 (0~3점)
  - 3점(우수), 2점(양호), 1점(미흡), 0점(미충족)
  - "있다"와 "잘했다"를 구분하여 변별력 확보

- **심사 결과 판정** (등급제 폐지 → 학술 심사 결과 통보 방식):
  - 🟢 **무수정 통과** (99~100점): Accept as is
  - 🔵 **수정 후 조건부 통과** (85~98점): Minor/Major Revision
  - 🟡 **수정 후 재심** (70~84점): Revise and Resubmit
  - 🟠 **대폭적 수정 후 재심** (51~69점): Reject with Resubmission
  - 🔴 **평가 불가** (0~50점): 심사기피

#### 5-6. 보고서 형식 개선
- 명칭 변경: "비평 보고서" → **"논문 평가 종합평"** (전체 프로젝트 일괄 적용)
- 보고서 순서 재구성:
  1. 총평
  2. 종합 점수 및 심사 결과 (점수표 + 심사결과 표식)
  3. 논문의 주요 강점
  4. 영역별 세부 평가 (표 → 문장 형식 서술)
  5. 핵심 개선 사항
  6. 논증 강화 제안
  7. 종합 의견
- 영역별 세부 평가에서 항목 코드(A1, B2 등) 표기 제거 → 자연스러운 문장으로만 서술

---

### Phase 6: 보고서 내보내기 기능 (2026-02-20)

#### 6-1. 백엔드 Export 모듈 (`backend/app/core/exporter.py`)
| 형식 | 구현 방식 | 특징 |
|------|----------|------|
| **TXT** | UTF-8 BOM 인코딩 | 메모장 한글 호환 |
| **PDF** | fpdf2 + 맑은 고딕 | 한글 깨짐 → 브라우저 인쇄로 대체 |
| **DOCX** | python-docx | 표/목록 자동 변환, 제목 페이지 포함 |

#### 6-2. API 엔드포인트 (`/api/v1/export`)
- `POST` 방식, JSON body (review, guidelines, filename, format)
- 한글 파일명 URL 인코딩 (`urllib.parse.quote`) 적용으로 latin-1 인코딩 에러 해결

#### 6-3. 프론트엔드 다운로드 버튼
- **TXT** / **DOCX**: 백엔드 API 호출 → Blob 다운로드
- **PDF (인쇄)**: 브라우저 새 창에서 인쇄 대화상자 → "PDF로 저장"
  - 백엔드 PDF 생성의 한글 깨짐 문제를 우회하는 안정적 방식
  - 마크다운→HTML 변환 함수 (`_markdownToHtml`) 프론트엔드에 구현

#### 6-4. 해결된 이슈
| 이슈 | 원인 | 해결 |
|------|------|------|
| 404 Not Found | 서버 미재시작 | 서버 재시작으로 해결 |
| 500 Internal Error | fpdf2 미설치 | `pip install fpdf2 python-docx` |
| latin-1 codec error | 한글 파일명이 HTTP 헤더에 직접 포함 | `urllib.parse.quote`로 URL 인코딩 |
| PDF 한글 깨짐 | fpdf2의 CJK 폰트 렌더링 한계 | 브라우저 인쇄 방식으로 전환 |

---

### Phase 8: RAG 파이프라인 논문 평가 통합 (2026-02-21)

#### 8-1. 문제 인식
- 기존 89개 논문이 ChromaDB에 저장되어 있었으나 **논문 평가에 전혀 활용되지 않음**
- LLM의 일반 지식만으로 평가 → 절대적 기준 없이 채점되어 변별력 불안정

#### 8-2. 데이터 분류 체계

| 데이터 종류 | 저장 위치 | 수준 | 역할 |
|-------------|-----------|------|------|
| 기존 89개 논문 | `data/chroma_db` | **80-85점 수준** | 분야별 표준 기준선 제공 |
| 벤치마크 논문 4편 | `data/chroma_benchmark` | 사용자 실제 심사 점수 | 채점 기준점(anchor) 제공 |

#### 8-3. 새로 생성된 파일

| 파일 | 역할 |
|------|------|
| `data/benchmark_metadata.json` | 벤치마크 논문 경로·점수·심사메모 설정 파일 |
| `data/benchmark/` | 벤치마크 논문 PDF 저장 폴더 |
| `backend/app/ingest_benchmark.py` | 벤치마크 논문 → ChromaDB 인제스트 스크립트 |
| `backend/app/core/rag_retriever.py` | 두 DB 검색 + 컨텍스트 생성 모듈 |

#### 8-4. reviewer.py 수정
```
[평가 논문 텍스트]
      ↓
[RAG 검색] ← rag_retriever.py
  ├── Reference DB 검색 (유사 논문 top-4, 80-85점 수준)
  └── Benchmark DB 검색 (유사 벤치마크 top-2, 실제 점수)
      ↓
[RAG Context 생성] → 두 Phase 프롬프트에 모두 주입
      ↓
Phase 1 (관찰): 유사논문 수준 인식하며 사실 기록
      ↓
Phase 2 (채점): "이 논문은 80-85점 수준 논문과 비교하면?" 상대평가
      ↓
[논문 평가 종합평 출력]
```

#### 8-5. 벤치마크 논문 등록 절차 (To-Do)
1. 4편의 논문 PDF를 `data/benchmark/` 폴더에 복사
2. `data/benchmark_metadata.json`에 제목·점수·심사 메모 입력
3. `backend/app/ingest_benchmark.py` 실행

---

### Phase 7: UI 텍스트 일괄 수정 (2026-02-20)
- "비평 보고서" → "논문 평가 종합평" 일괄 변경
  - `reviewer.py`, `guidelines.py`, `exporter.py`, `main.py`, `AnalysisView.tsx`
- 다운로드 파일명: `원본파일명_논문평가종합평.txt/docx`
- 인쇄용 PDF 제목: "논문 평가 종합평"

---

## 📁 현재 프로젝트 구조 (주요 파일)

```
260220_Architectural Thesis Advisor AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 서버 (업로드, 리뷰, 내보내기 API)
│   │   ├── ingest_data.py       # 기존 89개 논문 RAG 인제스트
│   │   ├── ingest_benchmark.py  # 벤치마크 논문 RAG 인제스트 (4편, 실제 점수)
│   │   └── core/
│   │       ├── reviewer.py      # 2단계 분리 평가 + RAG 컨텍스트 통합
│   │       ├── rag_retriever.py # RAG 검색 모듈 (reference + benchmark)
│   │       ├── guidelines.py    # 실행 과제 생성
│   │       └── exporter.py      # TXT/PDF/DOCX 내보내기
│   ├── .env                     # GOOGLE_API_KEY

│   └── requirements.txt
├── frontend/
│   └── src/
│       └── views/
│           └── AnalysisView.tsx  # 메인 분석 화면 (업로드, 결과, 다운로드)
├── docs/
│   └── Critical Peer Reviewer_ai_prompt.txt  # 평가 프롬프트 원본
└── development_modification_processes.md     # 본 문서
```

---

## 📝 다음 작업 중점 과제 (To-Do)

### 높은 우선순위
1. **변별력 검증**: 서로 다른 품질의 논문 3~5편으로 점수 분포 검증 (최소 15점 이상 차이 목표)
2. **일관성 검증**: 동일 논문 3회 반복 테스트로 점수 편차 확인 (±5점 이내 목표)
3. **심사 결과 정확성**: 총점과 심사 결과(🟢🔵🟡🟠🔴) 매칭 정확도 확인

### 중간 우선순위
4. **프론트엔드 UX**: 분석 진행 중 단계별 진행률 표시 개선 (Phase 1/2 진행상황)
5. **에러 핸들링**: API 타임아웃, 네트워크 오류 등 예외 상황 처리 강화
6. **DOCX 품질**: 표 렌더링 정확도 및 스타일 개선

### 낮은 우선순위
7. **RAG 파이프라인**: Vector DB 기반 유사 논문 참조 기능 (Phase 1 미완)
8. **배포**: Docker 컨테이너화 및 클라우드 배포
9. **사용자 피드백**: 평가 결과에 대한 동의/비동의 피드백 수집 기능

---

### Phase 9: 랜딩 페이지 UI/UX 전면 개편 (2026-02-21)

#### 9-1. 배경 플로팅 아이콘 교체 및 동작 강화
- **이전**: 단순 기하도형 5종 (삼각형·원·사각형·육각형·십자) — 불투명도 0.03~0.05
- **변경**: 학술 테마 SVG 아이콘 **14종** 도입 (졸업모자, 펼친책, 지구본, 전구, 트로피, 연필+자, 메달, 현미경, 돋보기, 뇌, 책스택, 스크롤, 컴퍼스, 부엉이)
- **불투명도**: 0.15 → 0.18 (시인성 3~6배 향상)
- **이동 범위 대폭 확대** (사용자 요청으로 2회 강화):
  - Y 이동: ±12px → ±18px → **±80~±120px**
  - X 이동: ±5px → ±7px → **±40~±60px**
  - 회전: ±8° → ±10° → **±10~±28°**
  - 사이클 속도: 13~28초 → **8~14초**

#### 9-2. Hero 헤드라인 문구 전면 수정 (교수·심사위원 대상으로 타겟 재정의)
- **이전 문구**: "심사위원 앞에 서기 전, / AI에게 먼저 혹독하게."
  - → 학생 관점의 문구 (프로그램 실제 사용자: 교수/심사위원)
- **최종 문구**: "직관에서 근거로 / 건축학논문 자동 심사 시스템"
  - 1줄: 흰색 세로 그라디언트
  - 2줄: 무빙 shimmer 효과 (보라→인디고→시안→핑크 순환, 3.5초)
- **폰트 크기**: `clamp(2.8rem, 7vw, 5.2rem)` → `clamp(2.4rem, 5.2vw, 4.4rem)` 조정 (2줄 표시 보장)

#### 9-3. "AI에게 먼저 혹독하게" → Moving Gradient Shimmer 효과
- `@keyframes shimmer-lr` 추가: `background-position` 0%→100%→0% 순환
- `background-size: 300%`, 색상 팔레트: `#c084fc → #818cf8 → #38bef0 → #a78bfa → #f472b6`
- `.hero-shimmer` CSS 클래스로 분리 적용

#### 9-4. 서브텍스트 2줄 고정 처리
- **이전**: `max-w-xl` + `text-lg` → 좁은 컨테이너로 3줄 강제 줄바꿈 발생
- **변경**: `max-w-3xl` + `text-base` + 명시적 `<br />` 삽입
- **최종 표시**:
  - 1줄: `89편 최우수 논문 벤치마크 벡터 DB와 50개 항목 2단계 AI 파이프라인으로,`
  - 2줄: `실제 심사위원보다 더 꼼꼼하게, 단 60초 만에 평가합니다.`
- 핵심 키워드(`89편`, `50개 항목 2단계 AI 파이프라인`, `60초`) bold 흰색 강조 유지

#### 9-5. 비밀번호 게이트 모달 추가
- **기능**: 모든 "평가 시작" 버튼 클릭 시 비밀번호 확인 모달 팝업
- **비밀번호**: `dongguk`
- **UI 구성**:
  - 배경: `rgba(0,0,0,0.75)` + `backdrop-filter: blur(10px)`
  - 카드: 다크 글래스 모피즘, 보라 테두리, 상단 그라디언트 액센트 바
  - 아이콘: `Lock` (보라 원형 배경)
  - 입력 중: `letter-spacing: 0.25em` (비밀번호 느낌)
- **오류 처리**: 빨간 테두리 + 좌우 흔들림 shake 애니메이션 + 오류 문구
- **적용 버튼**: 네비게이션 우측 / Hero CTA / 하단 최종 CTA 3곳 전부
- **닫기**: 배경 클릭 또는 취소 버튼 → 입력값 초기화

#### 9-6. 네비게이션 재구성
- **이전 구조**: 좌(㈜나인티나인) / 중(로고+제목) / 우(평가 시작 버튼)
- **최종 구조**: 좌(Ninetynine Inc. 링크) / 중(🎓 학사모 + Academic Advisor in Architecture + BETA) / 우(RAG AI CONNECTED 네온 배지)
- 회사명: `㈜나인티나인` → `Ninetynine Inc.`
- 브랜드명: `Thesis Advisor AI` → `Academic Advisor in Architecture`
- 아이콘: `<BookOpen />` →  `<GraduationCap />` SVG (Lucide, 흰색 90%, 보라 drop-shadow glow)

#### 9-7. RAG AI CONNECTED 네온 형광 깜빡임 배지
- **위치**: 네비게이션 우측 (기존 "평가 시작" 버튼 자리)
- **색상**: 형광 녹색 `#39ff14` (네온 효과)
- **애니메이션**: `@keyframes neon-flicker` — 형광등 깜빡임 재현
  - 빠른 이중 플리커 패턴 (19%, 24%, 54%, 56% 순간 소등)
  - `text-shadow` 4단계 글로우 (`4px → 10px → 20px → 40px`)
  - `box-shadow` 외부 발광 효과
- **점 아이콘**: `@keyframes rag-dot-pulse` — scale 1→1.3 + box-shadow 확산

#### 9-8. 수정·삭제된 텍스트 정리
| 항목 | 이전 | 최종 |
|---|---|---|
| 헤드라인 1줄 | "심사위원 앞에 서기 전," | "직관에서 근거로" |
| 헤드라인 2줄 | "AI에게 먼저 혹독하게." | "건축학논문 자동 심사 시스템" |
| 마침표 | "근거로." / "시스템." | 모두 제거 |
| "AI 기반" | 포함 | 삭제 (불필요한 중복) |
| Eyebrow 뱃지 | 건축학 논문 2-Stage AI 심사 시스템 | 유지 |

#### 9-9. 수정된 파일
- `frontend/src/views/LandingPage.tsx` — 전체 수정
  - `<style>` JSX 내 `@keyframes shimmer-lr`, `neon-flicker`, `rag-dot-pulse` 추가
  - `ACADEMIC_ICONS` 배열 이동 수치 대폭 확대
  - `showModal`, `pw`, `pwError`, `shaking` state 추가
  - `handlePwSubmit()` 함수 추가
  - Lucide import: `Lock`, `GraduationCap` 추가, `BookOpen` 제거

---

## Phase 10. GitHub 배포 및 NCP 서버 배포 (2026-02-21)

### 10-1. GitHub 저장소 초기화
- 저장소: `https://github.com/bignine99/architecture_thesis_ai_advisor`
- `.gitignore` 정비: `backend/venv/`, `data/`, `backend/.env` 제외
- `backend/.env.example` — 플레이스홀더만 포함 (실제 키 제외)
- API 키 노출 사고 → 즉시 히스토리 강제 초기화(`--force`) 후 재push

### 10-2. NCP 서버 배포
- **서버**: ninetynine-app / Ubuntu 24.04 / vCPU 2, RAM 8GB / 공인IP 223.130.151.228
- **백엔드**: FastAPI + ChromaDB → `/var/www/thesis/backend/` → systemd 상시 실행
- **프론트**: Vite 빌드 → `/var/www/thesis/frontend/dist/` → nginx 정적 서빙
- **nginx**: 80포트, `location /api/` → `localhost:8000` 프록시
- **접속 URL**: `http://223.130.151.228`
- **패스워드**: `dongguk`

### 10-3. 메인 홈페이지 연동
- `ninetynine99.co.kr/solutions` → 새 솔루션 카드 추가 (다른 Antigravity 처리)
- `ninetynine99.co.kr/thesis-advisor/` → 전용 랜딩 페이지 신규 생성
- Tech Stack 뱃지: React / FastAPI / ChromaDB / RAG 표시
- 패스워드 안내 및 임시 URL 연결

### 10-4. Vite 서브패스 설정 준비
- `vite.config.ts`에 `base: process.env.VITE_BASE_PATH || '/'` 추가
- 향후 `ninetynine99.co.kr/thesis-advisor/` 완전 통합 시:
  `VITE_BASE_PATH=/thesis-advisor/ npm run build` 후 nginx 재설정

### 10-5. SKILL.md 생성
- `.agent/skills/academic-dark-ui/SKILL.md`
- 랜딩 페이지 디자인 시스템 전체 문서화 (색상, 애니메이션, 컴포넌트, 레이아웃 패턴)
