---
name: Academic Dark UI Design System
description: >
  건축학논문 자동 심사 시스템(Academic Advisor in Architecture) 프로젝트에서
  최종 확정된 랜딩 페이지 & 본문 페이지 디자인 시스템.
  동일한 품질의 웹 페이지를 신속하게 구현하기 위한 완전한 가이드.
  Tech stack: React + TypeScript + Vite + Tailwind CSS + Framer Motion + Lucide React
---

# Academic Dark UI — Design System SKILL

## 1. 프로젝트 컨텍스트

이 스킬은 `Architectural Thesis Advisor AI` 프로젝트의 프론트엔드 디자인을 기반으로 합니다.
동일한 디자인 시스템으로 새 페이지를 만들 때 이 파일을 참조하십시오.

- **메인 파일**: `frontend/src/views/LandingPage.tsx`
- **앱 진입점**: `frontend/src/App.tsx`
- **스타일**: Tailwind CSS (utility-first) + inline style (컬러·그림자)
- **애니메이션**: Framer Motion (`motion.*`, `useInView`, `whileInView`)
- **아이콘**: Lucide React

---

## 2. 색상 시스템 (Color Tokens)

```
배경(Base):     #08080f        /* 거의 검정에 가까운 진한 남색 */
텍스트(Primary): rgba(255,255,255,0.88)
텍스트(Sub):     rgba(255,255,255,0.42)
텍스트(Muted):   rgba(255,255,255,0.28)

보라(Purple):   #a78bfa  / #7c3aed  (primary accent)
파랑(Blue):     #60a5fa  / #3b82f6
청록(Cyan):     #38bef0
초록(Green):    #34d399
노랑(Yellow):   #fbbf24
핑크(Pink):     #f472b6
주황(Orange):   #fb923c
형광녹(Neon):   #39ff14  (RAG badge 전용)

테두리:         rgba(255,255,255,0.06)  /* 기본 구분선 */
카드 배경:      rgba(255,255,255,0.025)
글로우 보라:    rgba(124,58,237,0.28)
```

### 메인 그라디언트
```css
/* Hero CTA 버튼, 아이콘 박스 등 */
background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);

/* 상단 그라디언트 보라 안개 */
background: radial-gradient(ellipse, rgba(120,40,255,0.13) 0%, transparent 65%);

/* 구분선 */
background: linear-gradient(90deg, transparent, rgba(124,58,237,0.18), rgba(59,130,246,0.18), transparent);
```

---

## 3. 배경 레이어 구조 (3-Layer Background)

```tsx
{/* Layer 1: 격자 그리드 */}
<div className="fixed inset-0 pointer-events-none" style={{
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)`,
    backgroundSize: '72px 72px',
    zIndex: 0,
}} />

{/* Layer 2: 상단 암막 페이드 */}
<div className="fixed inset-0 pointer-events-none" style={{
    background: 'radial-gradient(ellipse 70% 50% at 50% 0%, transparent 30%, #08080f 75%)',
    zIndex: 0,
}} />

{/* Layer 3: 보라 광원 */}
<div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
    width: 800, height: 450, zIndex: 0,
    background: 'radial-gradient(ellipse, rgba(120,40,255,0.13) 0%, transparent 65%)',
    filter: 'blur(24px)',
}} />
```

---

## 4. 플로팅 배경 아이콘 (FloatingShapes)

학술 테마 SVG 아이콘 14종이 화면 전체를 자유롭게 부유합니다.

### 아이콘 데이터 스펙
```ts
type IconDef = {
  type: string;   // 'graduation' | 'book' | 'globe' | 'bulb' | 'trophy' |
                  //  'pencilruler' | 'medal' | 'microscope' | 'magnify' |
                  //  'brain' | 'books' | 'scroll' | 'compass' | 'owl'
  x: number;     // 위치 % (left)
  y: number;     // 위치 % (top)
  s: number;     // 크기 px (58~72)
  o: number;     // 불투명도 (0.15~0.18)
  d: number;     // 애니메이션 duration 초 (8~14)
  c: string;     // 색상 hex
  dl: number;    // delay 초
  ry: number[];  // y 이동 범위 [시작, 끝, 시작] — ±80~±120px
  rx: number[];  // x 이동 범위 — ±40~±60px
  rr: number[];  // 회전 범위 — ±10~±28°
}
```

### 권장 배치 예시
```ts
const ACADEMIC_ICONS = [
    { type: 'graduation', x: 4,  y: 7,  s: 72, o: 0.18, d: 9,  c: '#a78bfa', dl: 0,   ry: [-100,100,-100], rx: [-50,50,-50], rr: [-20,20,-20] },
    { type: 'book',       x: 88, y: 5,  s: 66, o: 0.17, d: 11, c: '#60a5fa', dl: 1.2, ry: [-90,90,-90],   rx: [-45,45,-45], rr: [-15,15,-15] },
    { type: 'globe',      x: 80, y: 38, s: 68, o: 0.16, d: 13, c: '#a78bfa', dl: 0.5, ry: [-80,80,-80],   rx: [-40,40,-40], rr: [0,0,0]      },
    // ... (LandingPage.tsx의 전체 배열 참조)
];
```

### FloatingShapes 컴포넌트
```tsx
function FloatingShapes() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
            {ACADEMIC_ICONS.map((sh, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${sh.x}%`, top: `${sh.y}%` }}
                    animate={{ y: sh.ry, x: sh.rx, rotate: sh.rr }}
                    transition={{ duration: sh.d, delay: sh.dl, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <AcademicIcon type={sh.type} size={sh.s} color={sh.c} opacity={sh.o} />
                </motion.div>
            ))}
        </div>
    );
}
```

> **SVG 아이콘 코드 전체**: `frontend/src/views/LandingPage.tsx` 의 `AcademicIcon` 컴포넌트 참조

---

## 5. 애니메이션 CSS Keyframes

`<style>` JSX 태그로 컴포넌트 내에 주입합니다:

```tsx
<style>{`
    /* ── 좌우 무빙 그라디언트 (Hero 제목 2줄) ─────────── */
    @keyframes shimmer-lr {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    .hero-shimmer {
        background: linear-gradient(90deg,
            #c084fc 0%, #818cf8 18%, #38bef0 35%,
            #a78bfa 50%, #f472b6 68%, #38bef0 82%, #c084fc 100%
        );
        background-size: 300% 100%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer-lr 3.5s ease-in-out infinite;
    }

    /* ── 네온 형광등 깜빡임 (RAG AI CONNECTED 배지) ──── */
    @keyframes neon-flicker {
        0%, 18%, 22%, 25%, 53%, 57%, 100% {
            opacity: 1;
            text-shadow: 0 0 4px #39ff14, 0 0 10px #39ff14,
                         0 0 20px #39ff14, 0 0 40px #00ff88;
            box-shadow: 0 0 6px rgba(57,255,20,0.50),
                        0 0 14px rgba(57,255,20,0.28),
                        inset 0 0 6px rgba(57,255,20,0.12);
        }
        19%, 24%, 54%, 56% {
            opacity: 0.15;
            text-shadow: none;
            box-shadow: none;
        }
    }
    @keyframes rag-dot-pulse {
        0%, 100% { opacity:1; transform:scale(1);   box-shadow: 0 0 0 0 rgba(57,255,20,0.6); }
        50%       { opacity:0.7; transform:scale(1.3); box-shadow: 0 0 0 5px rgba(57,255,20,0); }
    }
    .rag-badge {
        animation: neon-flicker 2.8s ease-in-out infinite;
        border: 1px solid rgba(57,255,20,0.35);
        color: #39ff14;
        background: rgba(57,255,20,0.06);
    }
    .rag-dot {
        background: #39ff14;
        animation: rag-dot-pulse 1.2s ease-in-out infinite;
    }
`}</style>
```

---

## 6. 네비게이션 바 구조

```tsx
<nav className="fixed top-0 left-0 right-0 z-50" style={{
    background: 'rgba(8,8,15,0.80)',
    backdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
}}>
    <div className="max-w-6xl mx-auto px-6 h-14 grid grid-cols-3 items-center">

        {/* 좌: 회사 링크 */}
        <div className="flex items-center">
            <a href="https://..." target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-xs font-semibold transition-all"
               style={{ color: 'rgba(255,255,255,0.38)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
                <ExternalLink className="w-3 h-3" />
                Ninetynine Inc.
            </a>
        </div>

        {/* 중: 브랜드 로고 */}
        <div className="flex items-center justify-center gap-2.5">
            <GraduationCap className="flex-shrink-0"
                style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.90)',
                         filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.50))' }} />
            <span className="font-bold text-sm tracking-tight"
                  style={{ color: 'rgba(255,255,255,0.88)' }}>
                Academic Advisor in Architecture
            </span>
            <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                           border: '1px solid rgba(167,139,250,0.22)' }}>
                BETA
            </span>
        </div>

        {/* 우: RAG AI CONNECTED 배지 */}
        <div className="flex items-center justify-end">
            <div className="rag-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-md"
                 style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                <span className="rag-dot flex-shrink-0"
                      style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                RAG AI CONNECTED
            </div>
        </div>

    </div>
</nav>
```

---

## 7. Hero 섹션 구조

```tsx
<section className="relative flex items-center justify-center text-center px-6"
         style={{ minHeight: '100vh', paddingTop: '56px', zIndex: 1 }}>

    {/* 수평 글로우 선 */}
    <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none -translate-y-1/2"
         style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.18), rgba(59,130,246,0.18), transparent)' }} />

    <div className="max-w-4xl relative z-10">

        {/* Eyebrow 뱃지 */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: 0.25 }} className="flex justify-center mb-8">
            <div className="flex items-center gap-3 px-4 py-2 rounded-md"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                <span className="text-xs font-semibold tracking-widest uppercase"
                      style={{ color: 'rgba(255,255,255,0.45)' }}>
                    서비스 한 줄 설명 문구
                </span>
                <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
        </motion.div>

        {/* 메인 헤드라인 */}
        <motion.h1 initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
                   transition={{ delay: 0.38, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                   className="font-black leading-[1.08] tracking-tight mb-7"
                   style={{ fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)' }}>
            {/* 1줄: 흰색 */}
            <span style={{
                background: 'linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.50) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>직관에서 근거로</span>
            <br />
            {/* 2줄: shimmer 움직이는 색상 */}
            <span className="hero-shimmer">건축학논문 자동 심사 시스템</span>
        </motion.h1>

        {/* 서브텍스트 — 2줄 고정 */}
        <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: 0.55, duration: 0.7 }}
                  className="max-w-3xl mx-auto text-base leading-loose mb-12"
                  style={{ color: 'rgba(255,255,255,0.42)' }}>
            <span className="font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>핵심 숫자</span> 설명 문구 첫 줄,<br />
            나머지 설명 두 번째 줄.
        </motion.p>

        {/* CTA 버튼들 */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button onClick={() => setShowModal(true)}
                           whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                           className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-md font-bold text-base text-white"
                           style={{
                               background: 'linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%)',
                               boxShadow: '0 0 28px rgba(124,58,237,0.40), 0 0 56px rgba(124,58,237,0.14)',
                           }}>
                <FileText className="w-4 h-4" />
                메인 액션 버튼
                <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.a href="#section" whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-center gap-2 px-6 py-4 rounded-md font-semibold text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                               color: 'rgba(255,255,255,0.52)', cursor: 'pointer' }}>
                보조 액션 <ChevronRight className="w-3.5 h-3.5" />
            </motion.a>
        </motion.div>
    </div>
</section>
```

---

## 8. 비밀번호 게이트 모달

모든 CTA 버튼에 적용. 패턴은 고정 — 비밀번호만 변경.

```tsx
// State
const [showModal, setShowModal]   = useState(false);
const [pw, setPw]                 = useState('');
const [pwError, setPwError]       = useState(false);
const [shaking, setShaking]       = useState(false);

function handlePwSubmit() {
    if (pw === 'YOUR_PASSWORD') {   // ← 비밀번호 변경
        setShowModal(false); setPw(''); setPwError(false);
        onEnter();
    } else {
        setPwError(true); setShaking(true);
        setTimeout(() => setShaking(false), 600);
    }
}

// JSX
{showModal && (
    <motion.div className="fixed inset-0 z-[200] flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setPw(''); setPwError(false); } }}>
        <motion.div className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(14,14,26,0.95)', border: '1px solid rgba(167,139,250,0.25)',
                             boxShadow: '0 0 60px rgba(124,58,237,0.25)' }}
                    initial={{ opacity:0, scale:0.88, y:24 }}
                    animate={{ opacity:1, scale:1, y:0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

            {/* 상단 accent bar */}
            <div className="h-0.5 w-full"
                 style={{ background: 'linear-gradient(90deg,#7c3aed,#3b82f6,#7c3aed)' }} />

            <div className="p-8">
                {/* Lock 아이콘 */}
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                         style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.30)' }}>
                        <Lock className="w-6 h-6" style={{ color: '#a78bfa' }} />
                    </div>
                </div>
                <h3 className="text-center font-black text-xl mb-1"
                    style={{ color: 'rgba(255,255,255,0.90)' }}>접근 코드 확인</h3>
                <p className="text-center text-sm mb-8"
                   style={{ color: 'rgba(255,255,255,0.35)' }}>이 시스템은 접근 코드가 필요합니다.</p>

                {/* 입력창 (흔들림 애니메이션) */}
                <motion.div animate={shaking ? { x: [-10,10,-8,8,-4,4,0] } : { x: 0 }}
                            transition={{ duration: 0.5 }}>
                    <input type="password" placeholder="접근 코드 입력"
                           value={pw} onChange={e => { setPw(e.target.value); setPwError(false); }}
                           onKeyDown={e => e.key === 'Enter' && handlePwSubmit()}
                           autoFocus
                           className="w-full px-5 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all mb-3"
                           style={{
                               background: 'rgba(255,255,255,0.055)',
                               border: pwError ? '1.5px solid rgba(248,113,113,0.70)' : '1.5px solid rgba(255,255,255,0.10)',
                               color: 'rgba(255,255,255,0.88)',
                               letterSpacing: pw ? '0.25em' : '0',
                           }} />
                    {pwError && <p className="text-center text-xs mb-3" style={{ color: '#f87171' }}>
                        올바른 접근 코드가 아닙니다.
                    </p>}
                </motion.div>

                <motion.button onClick={handlePwSubmit}
                               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                               className="w-full py-3.5 rounded-xl font-bold text-sm text-white mb-3"
                               style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                                        boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}>
                    입장하기 <ArrowRight className="inline w-4 h-4 ml-1" />
                </motion.button>
                <button onClick={() => { setShowModal(false); setPw(''); setPwError(false); }}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold"
                        style={{ color: 'rgba(255,255,255,0.30)', background: 'transparent' }}>
                    취소
                </button>
            </div>
        </motion.div>
    </motion.div>
)}
```

---

## 9. 재사용 컴포넌트

### SLabel (섹션 레이블)
```tsx
function SLabel({ text, color = '#a78bfa' }: { text: string; color?: string }) {
    return (
        <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-5 h-px" style={{ background: color }} />
            <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase" style={{ color }}>
                {text}
            </span>
        </div>
    );
}
```

### PipeStage (파이프라인 단계 카드)
```tsx
function PipeStage({ n, title, sub, color, delay }) {
    return (
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col">
            <div className="text-[0.6rem] font-black tracking-widest mb-2.5" style={{ color }}>{n}</div>
            <div className="flex-1 rounded-lg p-5 relative overflow-hidden group transition-all duration-300"
                 style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${color}25` }}>
                {/* 상단 컬러 accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5"
                     style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                {/* 호버 오버레이 */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ background: `${color}05` }} />
                <div className="relative">
                    <div className="font-bold text-sm mb-2" style={{ color: 'rgba(255,255,255,0.82)' }}>{title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{sub}</div>
                </div>
            </div>
        </motion.div>
    );
}
```

### CapRow (기능 목록 행)
```tsx
function CapRow({ icon: Icon, color, title, desc, delay }) {
    return (
        <motion.div initial={{ opacity:0, x:-16 }} whileInView={{ opacity:1, x:0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4 py-6 group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg"
                 style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1">
                <div className="font-bold text-sm mb-1.5 group-hover:text-white/95 transition-colors"
                     style={{ color: 'rgba(255,255,255,0.82)' }}>{title}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>{desc}</div>
            </div>
        </motion.div>
    );
}
```

### ScoreBar (점수 진행 바)
```tsx
function ScoreBar({ label, val, max, color }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'rgba(255,255,255,0.50)' }}>{label}</span>
                <span className="font-bold tabular-nums" style={{ color }}>
                    {val}<span style={{ color: 'rgba(255,255,255,0.28)' }}>/{max}</span>
                </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div className="h-full rounded-full" style={{ background: color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(val/max)*100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.4, delay: 0.2, ease: [0.34, 1.1, 0.64, 1] }} />
            </div>
        </div>
    );
}
```

### Num (카운트업 숫자)
```tsx
function Num({ to, suffix = '' }: { to: number; suffix?: string }) {
    const [v, setV] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        const dur = 1800, fps = 60;
        const step = to / (dur / (1000 / fps));
        let cur = 0;
        const id = setInterval(() => {
            cur = Math.min(cur + step, to);
            setV(Math.round(cur));
            if (cur >= to) clearInterval(id);
        }, 1000 / fps);
        return () => clearInterval(id);
    }, [inView, to]);
    return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}
```

---

## 10. 레이아웃 섹션 패턴

### Stats Bar
```tsx
<section className="relative py-14 px-6" style={{
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 1,
}}>
    <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {/* 각 stat: */}
        <div>
            <div className="text-3xl font-black mb-1" style={{ color: '#a78bfa' }}>
                <Num to={89} />편
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>레이블</div>
        </div>
    </div>
</section>
```

### 파이프라인 그리드 (3+2)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
    {/* 왼쪽: STAGE 01~03 */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stages.slice(0, 3).map((s, i) => <PipeStage key={i} {...s} delay={i * 0.1} />)}
    </div>
    {/* 오른쪽: STAGE 04~05 */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {stages.slice(3).map((s, i) => <PipeStage key={i} {...s} delay={(i + 3) * 0.1} />)}
    </div>
</div>
```

### 기능 목록 + 미리보기 좌우 분할
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
    {/* 좌: 기능 목록 */}
    <div className="divide-y divide-transparent">
        {caps.map((c, i) => <CapRow key={i} {...c} delay={i * 0.08} />)}
    </div>
    {/* 우: 점수 미리보기 카드 */}
    <div className="sticky top-24">
        <div className="rounded-xl p-6" style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
        }}>
            {/* ScoreBar 목록 */}
        </div>
    </div>
</div>
```

---

## 11. 푸터 패턴

```tsx
<footer className="relative py-12 px-6" style={{
    borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 1,
}}>
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-6">
        {/* 좌: 회사 정보 */}
        <div>
            <div className="flex items-center gap-2 mb-3">
                <GraduationCap style={{ width: 18, height: 18, color: '#a78bfa' }} />
                <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    Academic Advisor in Architecture
                </span>
            </div>
            <div className="text-xs space-y-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                <div>Powered by Gemini 2.5 Flash</div>
                <div>연락처 정보</div>
            </div>
        </div>
        {/* 우: 저작권 */}
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
            © 2026 All rights reserved by Ninetynine Inc.
        </div>
    </div>
</footer>
```

---

## 12. Framer Motion 공통 패턴

```tsx
/* 스크롤 진입 페이드업 */
initial={{ opacity: 0, y: 24 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: '-40px' }}
transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}

/* 버튼 호버/탭 */
whileHover={{ scale: 1.03 }}
whileTap={{ scale: 0.97 }}

/* 페이지 진입/퇴장 */
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0, y: -10 }}
transition={{ duration: 0.4 }}
```

---

## 13. 새 페이지 제작 체크리스트

새 랜딩 / 소개 / 기능 페이지를 만들 때 순서대로 작업하십시오:

- [ ] **1. 배경** — 3-Layer Background (격자 + 암막 + 보라 광원) 복사
- [ ] **2. FloatingShapes** — `AcademicIcon` + `ACADEMIC_ICONS` 배열 + 컴포넌트 복사. 아이콘 타입/색/위치만 용도에 맞게 수정
- [ ] **3. CSS 주입** — `<style>` 태그에 `shimmer-lr` + `neon-flicker` + `rag-dot-pulse` keyframe 복사
- [ ] **4. 네비게이션** — 3-col grid 구조 사용. 좌(회사링크) / 중(브랜드) / 우(RAG 배지 또는 다른 CTA)
- [ ] **5. Hero 헤드라인** — 1줄 흰색 + 2줄 `.hero-shimmer`. `clamp(2.4rem, 5.2vw, 4.4rem)` 폰트. 2줄 피팅 확인
- [ ] **6. Eyebrow 뱃지** — 초록 점 `animate-pulse` + 키워드 문구 + `ChevronRight`
- [ ] **7. 서브텍스트** — `max-w-3xl` + `text-base` + 명시적 `<br />` 으로 2줄 고정
- [ ] **8. CTA 버튼** — 보라→파랑 그라디언트 + glow boxShadow + `whileHover scale` + 비밀번호 게이트 모달
- [ ] **9. Stats Bar** — `<Num>` 카운트업 컴포넌트 + 4열 그리드
- [ ] **10. 콘텐츠 섹션** — `<SLabel>` + `<PipeStage>` / `<CapRow>` / `<ScoreBar>` 재사용
- [ ] **11. 최종 CTA 섹션** — 반복되는 큰 버튼 + 배경 glow 강화
- [ ] **12. 푸터** — 2-col, 좌(로고+정보) / 우(저작권)

---

## 14. 주의사항 (Known Gotchas)

1. **한글 텍스트 자동 변환**: 한글 문자열이 Unicode escape로 변환될 수 있음. 파일 저장 후 직접 확인 필수.
2. **React Fragment 닫기**: `<style>` 태그와 `<motion.div>` 를 함께 `<>...</>` 로 감쌀 때 `</>` 누락 주의.
3. **서브텍스트 3줄 문제**: `max-w-xl + text-lg` 조합은 반드시 3줄로 넘칩니다. `max-w-3xl + text-base` 사용.
4. **오탈자 자동 수정**: 파일 편집 시 "꼼꼼하게" → "꼬꼬하게" 등 한글 오탈자가 생성될 수 있음. 반드시 검토.
5. **emoji vs SVG**: 어두운 배경에서 이모지는 색상 제어 불가. Lucide SVG 아이콘을 사용하고 `color` 속성으로 흰색 설정.
6. **비밀번호 하드코딩**: 현재 `dongguk` 으로 하드코딩. 환경변수로 분리할 경우 Vite의 `import.meta.env.VITE_*` 사용.
