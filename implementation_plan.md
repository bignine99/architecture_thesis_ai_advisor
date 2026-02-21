# 건축설계 논문 지도교수 AI (Architectural Thesis Advisor AI) - Implementation Plan

## 1. 프로젝트 초기 설정 및 환경 구성 (Phase 0: Project Setup)
- [ ] **저장소 초기화**:
    - `.gitignore` 생성 (Python, Node.js, OS 환경 설정 무시)
    - `README.md` 작성 (프로젝트 개요 및 설치 가이드)
- [ ] **디렉토리 구조 생성**:
    - `backend/`: FastAPI 서버 및 AI 로직
    - `frontend/`: React 클라이언트 애플리케이션
    - `data/`: RAG용 데이터 및 테스트 논문 PDF 저장소
    - `docs/`: 기술 문서 및 API 명세서

## 2. 백엔드 및 데이터 파이프라인 개발 (Phase 1: Backend & Data Pipeline)
- [ ] **FastAPI 서버 구축**:
    - 기본 FastAPI 앱 설정 (`main.py`)
    - API 라우터 구조 설계 (`/api/v1/review`, `/api/v1/rag`, `/api/v1/tasks`)
    - CORS 설정 (Frontend 통신 허용)
- [ ] **RAG 엔진 구축**:
    - **Document Parsing**: `PyMuPDF` 또는 `Unstructured`를 사용하여 PDF 텍스트 및 메타데이터 추출 모듈 개발
    - **Chunking Strategy**: 논문 구조(서론, 본론, 결론)에 맞춘 텍스트 분할 로직 구현
    - **Embedding**: `Sentence-BERT` 또는 OpenAI Embedding API 연동
    - **Vector DB**: `ChromaDB` (로컬 개발용) 설치 및 데이터 인덱싱 파이프라인 구축
- [ ] **PDF 분석 모듈 (Critical Reviewer)**:
    - 텍스트/이미지 추출 및 전처리 파이프라인 구현
    - LangChain을 활용한 LLM 프롬프트 템플릿 설계 (비평, 논리성 검증)

## 3. AI 코어 로직 개발 (Phase 2: AI Core Logic)
- [ ] **Critical Review Agent**:
    - 논문 섹션별 분석 프롬프트 엔지니어링 (서론의 명확성, 본론의 팩트 체크 등)
    - RAG 기반 참고 문헌 추천 로직 구현
- [ ] **Guideline Generator**:
    - 리뷰 결과를 바탕으로 수정 방향 제안 로직 구현
    - 챕터별 구체적 작성 가이드 생성 프롬프트 개발
- [ ] **Task Manager & History**:
    - 다음 미팅 전까지 수행할 Action Item 추출 로직
    - 과제 수행 여부 체크 및 진행률 추적 API 개발

## 4. 프론트엔드 개발 (Phase 3: Frontend Development)
- [ ] **React 프로젝트 초기화**:
    - Vite 기반 React 프로젝트 생성 (TypeScript 사용 권장)
    - Tailwind CSS 설치 및 디자인 시스템(색상, 폰트) 설정
- [ ] **UI 컴포넌트 개발**:
    - **Dashboard Shell**: 사이드바, 헤더, 메인 콘텐츠 영역 레이아웃
    - **PDF Uploader**: Drag & Drop 파일 업로드 컴포넌트 (진행률 표시)
    - **Review Viewer**: AI 피드백을 섹션별로 보여주는 아코디언 UI
    - **Chat Interface**: AI 조교와 대화할 수 있는 인터페이스 (선택 사항)
    - **Task List**: 할 일 목록 및 체크박스 UI
- [ ] **API 연동**:
    - Axios 또는 React Query를 사용한 백엔드 API 통신 구현
    - 실시간 분석 상태 표시 (Loading States)

## 5. 통합 및 테스트 (Phase 4: Integration & Testing)
- [ ] **시스템 통합 테스트**:
    - 파일 업로드 -> 분석 -> 결과 확인 -> 과제 생성 전체 흐름 테스트
- [ ] **성능 최적화**:
    - 대용량 PDF 처리 속도 개선 (비동기 작업 큐 도입 고려)
    - 프롬프트 튜닝 (정확도 및 응답 품질 개선)
- [ ] **배포 준비**:
    - Dockerfile 작성 (Frontend, Backend)
    - `docker-compose.yml` 작성

## 6. 미래 확장 (Future Scope)
- [ ] 교수용 대시보드 (학생별 진척도 모니터링)
- [ ] 도면 분석 기능 강화 (Vision model 활용)
