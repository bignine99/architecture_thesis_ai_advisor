# Architectural Thesis Advisor AI (건축설계 논문 지도교수 AI)

**건축학/건축공학 전공 학생의 설계 논문 작성 전 과정을 보조하고, 지도교수의 업무 부담을 최소화하는 AI 기반 논문 지도 자동화 웹 플랫폼**

## 1. 프로젝트 개요 (Overview)
- **목표**: 우수 논문 데이터 기반의 맞춤형 지도, 비평, 과제 관리 자동화
- **타겟 사용자**: 건축설계 논문 작성자(학생), 논문 지도교수

## 2. 핵심 기능 (Core Features)
- **Reference RAG 엔진**: 검증된 우수 논문 및 법규 데이터 기반 맟춤형 자료 추천
- **Multi-modal Critical Reviewer**: 텍스트와 도면을 함께 분석하여 논리적/시각적 타당성 평가
- **Chapter-by-Chapter 가이드라인**: 서론, 본론, 결론 등 각 장별 구체적 작성 방향 제시
- **Intelligent Task Manager**: 다음 미팅까지의 과제 생성 및 이행 여부 추적

## 3. 기술 스택 (Tech Stack)
- **Frontend**: React.js (Vite), Tailwind CSS
- **Backend**: Python, FastAPI
- **AI/LLM**: LangChain, OpenAI/Gemini (Multi-modal Support)
- **Vector DB**: ChromaDB / Pinecone
- **Data Parsing**: PyMuPDF


## 4. 설치 및 실행 (Setup & Run)
1. **필수 요구사항 (Prerequisites)**:
    - Python 3.8+
    - Node.js 16+
2. **초기 설정 (Initialization)**:
    - 프로젝트 루트에서 `setup_project.bat` 파일을 실행하여 백엔드 가상환경(venv) 생성 및 프론트엔드 의존성을 설치합니다.
3. **실행 (Run)**:
    - Backend: `cd backend` -> `venv\Scripts\activate` -> `uvicorn app.main:app --reload`
    - Frontend: `cd frontend` -> `npm run dev`

## 5. 개발 로드맵 (Roadmap)
1. **[완료] 기획 및 초기 설정**: Phase 0 Complete.
2. **RAG 파이프라인 구축**: PDF 데이터 파싱, 임베딩, DB 적재

3. **AI 엔진 개발**: 비평 및 가이드 생성 로직 구현
4. **프론트엔드 통합**: React 대시보드 및 결과 뷰어 개발
5. **테스트 및 배포**: 통합 테스트, Docker 배포

---
Developed by Antigravity (Google DeepMind) & User
