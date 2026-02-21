import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Upload, AlertCircle, FileText, CheckCircle2, ArrowRight, XCircle,
  Download, Printer, Database, Sparkles, BarChart3, ListChecks,
  RefreshCw, Loader2, Scale, Search, ClipboardList, FileSearch,
  ShieldAlert, ShieldX, ShieldCheck, ShieldQuestion, Minus,
  BookOpen, Send, MessageSquare, ChevronRight, Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Types ───────────────────────────────────────────────────
interface Scores { A: number; B: number; C: number; D: number; total: number; }
interface RagPaper {
  type: 'reference' | 'benchmark';
  title: string;
  score_range: string;
  score: number | null;
  decision: string;
  notes: string;
  rank: number;
}
interface Result {
  filename: string; total_pages: number; text_length: number; truncated: boolean;
  review: string; guidelines: string;
  scores: Scores; rag_papers: RagPaper[];
}
interface ChatMsg { role: 'user' | 'ai'; content: string; }
type Phase = 'upload' | 'analyzing' | 'results';
type ResultTab = 'scores' | 'review' | 'guidelines' | 'chat' | 'rag';

// ─── MD → print HTML ────────────────────────────────────────
function mdToHtml(md: string): string {
  let h = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = h.split('\n'); const out: string[] = []; let inList = false; let inTbl = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (t.startsWith('|') && t.endsWith('|')) {
      const cells = t.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      if (!inTbl) { out.push('<table>'); inTbl = true; out.push('<tr>' + cells.map(c => `<th>${c.replace(/\*\*/g, '')}</th>`).join('') + '</tr>'); continue; }
      out.push('<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>'); continue;
    } else if (inTbl) { out.push('</table>'); inTbl = false; }
    if (!t) { if (inList) { out.push('</ul>'); inList = false; } out.push('<br>'); continue; }
    if (t.startsWith('### ')) { out.push(`<h3>${t.slice(4)}</h3>`); continue; }
    if (t.startsWith('## ')) { out.push(`<h2>${t.slice(3)}</h2>`); continue; }
    if (t.startsWith('# ')) { out.push(`<h1>${t.slice(2)}</h1>`); continue; }
    if (/^-{3,}$/.test(t)) { out.push('<hr>'); continue; }
    if (t.startsWith('- ') || t.startsWith('* ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${t.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`); continue;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    out.push(`<p>${t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`);
  }
  if (inList) out.push('</ul>'); if (inTbl) out.push('</table>');
  return out.join('\n');
}

// ─── Grade Info ──────────────────────────────────────────────
type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
interface GradeInfo {
  grade: Grade; label: string; neonClass: string; borderClass: string;
  bgClass: string; iconGlowClass: string; ringColor: string;
  GradeIcon: React.ElementType;
}
function getGradeInfo(score: number): GradeInfo {
  if (score >= 85) return { grade: 'A', label: '조건부 통과', neonClass: 'neon-blue', borderClass: 'neon-blue-border', bgClass: 'neon-blue-bg', iconGlowClass: 'icon-glow-blue', ringColor: '#38beff', GradeIcon: ShieldCheck };
  if (score >= 70) return { grade: 'B', label: '수정 후 재심', neonClass: 'neon-yellow', borderClass: 'neon-yellow-border', bgClass: 'neon-yellow-bg', iconGlowClass: 'icon-glow-yellow', ringColor: '#ffe033', GradeIcon: ShieldQuestion };
  if (score >= 51) return { grade: 'C', label: '대폭 수정 재심', neonClass: 'neon-orange', borderClass: 'neon-orange-border', bgClass: 'neon-orange-bg', iconGlowClass: 'icon-glow-orange', ringColor: '#ff8c42', GradeIcon: ShieldAlert };
  return { grade: 'D', label: '평가 불가', neonClass: 'neon-red', borderClass: 'neon-red-border', bgClass: 'neon-red-bg', iconGlowClass: 'icon-glow-red', ringColor: '#ff3355', GradeIcon: ShieldX };
}

// ─── Score Ring ──────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 52, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      <circle cx="68" cy="68" r={r + 4} fill="none" stroke={color} strokeWidth="1" opacity="0.12" />
      <circle cx="68" cy="68" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="7" />
      <motion.circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.7, delay: 0.3, ease: [0.34, 1.3, 0.64, 1] }}
        style={{
          transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
          filter: `drop-shadow(0 0 8px ${color}cc) drop-shadow(0 0 20px ${color}66)`
        }}
      />
    </svg>
  );
}

// ─── Domain Gauge ────────────────────────────────────────────
interface DomainGaugeProps {
  label: string; sub: string; score: number; max: number;
  color: string; glowClass: string; neonClass: string; delay?: number;
}
function DomainGauge({ label, sub, score, max, color, neonClass, delay = 0 }: Omit<DomainGaugeProps, 'glowClass'> & { glowClass?: string }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-sm font-bold ${neonClass}`}>{label}</span>
          <span className="text-white/25 text-xs ml-2">{sub}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-black tabular-nums ${neonClass}`}>{score}</span>
          <span className="text-white/25 text-xs">/ {max}</span>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--ring-track)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.34, 1.3, 0.64, 1] }}
        />
        {/* Glow */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full blur-sm"
          style={{ background: color, opacity: 0.5 }}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.34, 1.3, 0.64, 1] }}
        />
      </div>
      {/* Grade chip */}
      <div className="flex justify-end">
        <span className={`text-[9.5px] tracking-widest uppercase px-2 py-0.5 rounded-full`}
          style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
          {pct >= 90 ? '탁월' : pct >= 75 ? '양호' : pct >= 55 ? '보통' : '미흡'}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Spider / Radar Chart ────────────────────────────────────
function RadarChart({ scores }: { scores: Scores }) {
  const cx = 140, cy = 140, r = 100;
  const domains = [
    { key: 'A', label: '논리성', max: 30 },
    { key: 'B', label: '체계성', max: 30 },
    { key: 'C', label: '독창성', max: 20 },
    { key: 'D', label: '반증성', max: 20 },
  ];
  const n = domains.length;
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const getPoint = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angle(i)),
    y: cy + r * ratio * Math.sin(angle(i)),
  });

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];
  // Axes points at full extent
  const axisEnds = domains.map((_, i) => getPoint(i, 1));
  // Data polygon – 최소 ratio 0.02로 중심 충돌 방지
  const dataPoints = domains.map((d, i) => {
    const key = d.key as keyof Scores;
    const val = typeof scores[key] === 'number' ? (scores[key] as number) : 0;
    const ratio = Math.max(val / d.max, 0.02);  // 0점이어도 최소 dot 표시
    return getPoint(i, ratio);
  });
  const polyStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width="280" height="280" viewBox="0 0 280 280">
        {/* Grid rings */}
        {rings.map((ratio, ri) => (
          <polygon key={ri}
            points={polyStr(domains.map((_, i) => getPoint(i, ratio)))}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {axisEnds.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {/* Data area (animated) */}
        <motion.polygon
          points={polyStr(dataPoints)}
          fill="rgba(181,123,255,0.12)"
          stroke="#b57bff"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.5, ease: [0.34, 1.3, 0.64, 1] }}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            filter: 'drop-shadow(0 0 8px rgba(181,123,255,0.5))'
          }}
        />
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="5"
            fill="#b57bff"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.08, type: 'spring' }}
            style={{ filter: 'drop-shadow(0 0 5px #b57bff)' }}
          />
        ))}
        {/* Labels */}
        {domains.map((d, i) => {
          const lp = getPoint(i, 1.22);
          return (
            <text key={i} x={lp.x} y={lp.y}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)" fontSize="11" fontWeight="600"
              fontFamily="Inter,sans-serif"
            >
              {d.label}
            </text>
          );
        })}
        {/* Center label */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.15)" fontSize="10" fontFamily="Inter,sans-serif">
          {scores.total}/100
        </text>
      </svg>
    </div>
  );
}

// ─── Scores Panel ────────────────────────────────────────────
function ScoresPanel({ scores }: { scores: Scores }) {
  const DOMAINS = [
    { key: 'A', label: 'A. 논리성 및 담론', sub: 'Logic & Discourse', max: 30, color: '#38beff', glowClass: 'icon-glow-blue', neonClass: 'neon-blue' },
    { key: 'B', label: 'B. 체계성 및 방법론', sub: 'Methodology', max: 30, color: '#b57bff', glowClass: 'icon-glow-purple', neonClass: 'neon-purple' },
    { key: 'C', label: 'C. 독창성 및 기여', sub: 'Originality', max: 20, color: '#00ff94', glowClass: 'icon-glow-green', neonClass: 'neon-green' },
    { key: 'D', label: 'D. 반증성 및 한계', sub: 'Falsifiability', max: 20, color: '#ffe033', glowClass: 'icon-glow-yellow', neonClass: 'neon-yellow' },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
      {/* Left: Gauges */}
      <div className="space-y-7">
        <h3 className="text-xs font-bold tracking-widest uppercase text-white/25 mb-5">영역별 점수</h3>
        {DOMAINS.map((d, i) => (
          <DomainGauge key={d.key}
            label={d.label} sub={d.sub}
            score={(scores[d.key as keyof Scores] as number) ?? 0}
            max={d.max} color={d.color} glowClass={d.glowClass} neonClass={d.neonClass}
            delay={i * 0.1}
          />
        ))}

        {/* Total bar */}
        <div className="pt-4 border-t border-white/[0.05]">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold tracking-widest uppercase text-white/35">종합 점수</span>
            <span className="text-3xl font-black neon-purple tabular-nums">{scores.total}</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg,#7c3aed,#b57bff,#38beff)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${scores.total}%` }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.34, 1.3, 0.64, 1] }}
            />
            <motion.div className="absolute inset-y-0 left-0 rounded-full blur-sm"
              style={{ background: '#b57bff', opacity: 0.5 }}
              initial={{ width: '0%' }}
              animate={{ width: `${scores.total}%` }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.34, 1.3, 0.64, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Right: Radar */}
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-xs font-bold tracking-widest uppercase text-white/25 mb-2">균형 분석</h3>
        <RadarChart scores={scores} />
        <p className="text-[10px] text-white/20 text-center mt-1">
          보라색 영역이 넓을수록 균형 잡힌 논문입니다
        </p>
      </div>
    </div>
  );
}

// ─── Chat Panel ──────────────────────────────────────────────
function ChatPanel({ review, guidelines }: { review: string; guidelines: string }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'ai', content: '안녕하세요! 평가 결과에 대해 궁금한 점이 있으면 질문해 주세요. 예: "왜 D 영역 점수가 낮게 나왔나요?", "서론 부분을 어떻게 개선해야 하나요?"' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const msg = input.trim(); if (!msg || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = msgs.filter(m => m.role !== 'ai' || msgs.indexOf(m) > 0)
        .map(m => ({ role: m.role, content: m.content }));
      const res = await axios.post(`${API_BASE_URL}/api/v1/chat`,
        { message: msg, review, guidelines, history }, { timeout: 30000 });
      setMsgs(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', content: '오류가 발생했습니다. 백엔드 서버를 확인해 주세요.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="p-6 space-y-4 min-h-[300px]">
        {msgs.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'ai' && (
              <div className="p-2 rounded-xl mr-2 flex-shrink-0 mt-1"
                style={{ background: 'rgba(181,123,255,0.1)', border: '1px solid rgba(181,123,255,0.2)' }}>
                <Sparkles className="w-3.5 h-3.5 icon-glow-purple" style={{ color: '#b57bff' }} />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
              ${m.role === 'user'
                ? 'text-white/90 rounded-tr-sm'
                : 'text-white/75 rounded-tl-sm glass'
              }`}
              style={m.role === 'user'
                ? { background: 'rgba(124,58,237,0.35)', border: '1px solid rgba(124,58,237,0.35)' }
                : {}}
            >
              {m.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(181,123,255,0.1)' }}>
              <Sparkles className="w-3.5 h-3.5 icon-glow-purple" style={{ color: '#b57bff' }} />
            </div>
            <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#b57bff' }} />
              <span className="text-xs text-white/35">분석 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {['D 영역이 낮은 이유는?', '서론 개선 방법을 알려줘', '독창성을 높이려면?', '우선 수정해야 할 부분은?'].map(q => (
          <button key={q} onClick={() => { setInput(q); }}
            className="flex-shrink-0 text-[10.5px] px-3 py-1.5 rounded-full border border-white/8 bg-white/3 text-white/35 hover:bg-white/7 hover:text-white/70 transition-all whitespace-nowrap">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="평가 결과에 대해 질문하세요..."
            className="flex-1 px-4 py-3 rounded-xl text-sm text-white bg-white/4 border border-white/8
              focus:outline-none focus:border-purple-500/40 focus:bg-purple-500/5 transition-all placeholder-white/20"
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="btn-primary px-4 py-3 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RAG Papers Panel ────────────────────────────────────────
function RagPapersPanel({ papers }: { papers: RagPaper[] }) {
  const refs = papers.filter(p => p.type === 'reference');
  const benchs = papers.filter(p => p.type === 'benchmark');

  if (!papers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Database className="w-9 h-9 mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
        <p className="text-white/25 text-sm">RAG가 연결되지 않아 참조 논문 정보가 없습니다.</p>
      </div>
    );
  }

  const PaperCard = ({ p }: { p: RagPaper }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover rounded-2xl p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${p.type === 'benchmark' ? 'icon-glow-green' : 'icon-glow-blue'}`}
            style={{ color: p.type === 'benchmark' ? '#00ff94' : '#38beff' }} />
          <p className="text-sm font-semibold text-white/80 truncate">{p.title}</p>
        </div>
        <span className={`flex-shrink-0 text-[9.5px] font-bold uppercase tracking-widest px-2 py-1 rounded-full
          ${p.type === 'benchmark'
            ? 'neon-green' : 'neon-blue'}`}
          style={{
            background: p.type === 'benchmark' ? 'rgba(0,255,148,0.08)' : 'rgba(56,190,255,0.08)',
            border: `1px solid ${p.type === 'benchmark' ? 'rgba(0,255,148,0.2)' : 'rgba(56,190,255,0.2)'}`,
          }}>
          {p.type === 'benchmark' ? '벤치마크' : '참조'}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-white/30 flex items-center gap-1">
          <ChevronRight className="w-2.5 h-2.5" />
          {p.score != null ? `${p.score}점` : p.score_range}
        </span>
        <span className="text-[10px] text-white/25">{p.decision}</span>
        {p.notes && <span className="text-[10px] text-white/20 italic">— {p.notes}</span>}
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 space-y-6">
      {refs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-3.5 h-3.5 icon-glow-blue" style={{ color: '#38beff' }} />
            <p className="text-xs font-bold neon-blue tracking-widest uppercase">참조 논문 DB (80~85점 기준선)</p>
          </div>
          <div className="space-y-2">{refs.map((p, i) => <PaperCard key={i} p={p} />)}</div>
        </div>
      )}
      {benchs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-3.5 h-3.5 icon-glow-green" style={{ color: '#00ff94' }} />
            <p className="text-xs font-bold neon-green tracking-widest uppercase">벤치마크 DB (실제 심사 기준)</p>
          </div>
          <div className="space-y-2">{benchs.map((p, i) => <PaperCard key={i} p={p} />)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline ────────────────────────────────────────────────
const STEPS = [
  { id: 1, Icon: FileSearch, label: 'PDF 추출', sub: 'PyMuPDF', glowClass: 'icon-glow-blue' },
  { id: 2, Icon: Database, label: 'RAG 검색', sub: '89개 참조 논문', glowClass: 'icon-glow-purple' },
  { id: 3, Icon: Search, label: 'Phase 1 관찰', sub: '50개 체크리스트', glowClass: 'icon-glow-purple' },
  { id: 4, Icon: Scale, label: 'Phase 2 채점', sub: '상대 평가', glowClass: 'icon-glow-blue' },
  { id: 5, Icon: ClipboardList, label: '과제 생성', sub: '개선 전략', glowClass: 'icon-glow-green' },
];
function AnalyzingView({ filename }: { filename: string }) {
  const [step, setStep] = useState(1);
  useEffect(() => {
    const ts = [3500, 10000, 35000, 65000];
    const timers = ts.map((t, i) => setTimeout(() => setStep(s => Math.max(s, i + 2)), t));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16 gap-10">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: 'rgba(181,123,255,0.18)' }} />
        <div className="relative glass rounded-3xl p-9" style={{ boxShadow: '0 0 40px rgba(181,123,255,0.2)' }}>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border border-purple-500/15 rounded-full animate-spin-slow" style={{ borderTopColor: 'rgba(181,123,255,0.5)' }} />
            <div className="absolute inset-2 border border-blue-500/20 rounded-full" style={{ animation: 'spin-slow 1.1s linear infinite reverse', borderRightColor: 'rgba(56,190,255,0.5)' }} />
            <Sparkles className="w-6 h-6 icon-glow-purple" style={{ color: '#b57bff' }} />
          </div>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-black gradient-text mb-1">AI 심층 분석 중</h3>
        <p className="text-white/30 text-sm font-medium">{filename}</p>
      </div>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = step > s.id, active = step === s.id, { Icon, glowClass } = s;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0 w-20">
                  <motion.div animate={active ? { scale: [1, 1.07, 1] } : {}} transition={{ repeat: Infinity, duration: 1.6 }}
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 ${done ? 'step-done' : active ? 'step-active' : 'step-pending'}`}>
                    {done
                      ? <CheckCircle2 className="w-5 h-5 icon-glow-green" style={{ color: '#00ff94' }} />
                      : <Icon className={`w-5 h-5 ${active ? glowClass : ''}`} style={{ color: active ? undefined : 'rgba(255,255,255,0.18)' }} />
                    }
                  </motion.div>
                  <p className={`mt-2 text-[10.5px] font-medium text-center leading-tight transition-colors duration-500 ${done ? 'neon-green' : active ? 'neon-purple' : 'text-white/20'}`}>{s.label}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-1 mb-8 rounded-full overflow-hidden bg-white/5">
                    <motion.div className="h-full" style={{ background: 'linear-gradient(90deg,#00ff94,#b57bff)' }}
                      initial={{ width: '0%' }} animate={{ width: done ? '100%' : active ? '55%' : '0%' }} transition={{ duration: 0.9 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-white/18 text-xs tracking-wide">평균 1~3분 소요 · 논문 길이에 따라 다를 수 있습니다</p>
    </motion.div>
  );
}

// ─── History helpers ─────────────────────────────────────────
const HISTORY_KEY = 'thesis_eval_history';
function saveHistory(result: Result) {
  try {
    const prev: (Result & { savedAt: string })[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = { ...result, savedAt: new Date().toISOString() };
    // avoid duplicate by filename+text_length
    const dedup = prev.filter(p => !(p.filename === result.filename && p.text_length === result.text_length));
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...dedup].slice(0, 30)));
  } catch { }
}

// ─── Main Component ──────────────────────────────────────────
interface AnalysisViewProps {
  initialResult?: Result | null;
  onClear?: () => void;
}
export default function AnalysisView({ initialResult, onClear: _onClear }: AnalysisViewProps) {
  const [phase, setPhase] = useState<Phase>(initialResult ? 'results' : 'upload');
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(initialResult ?? null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDL] = useState<string | null>(null);
  const [tab, setTab] = useState<ResultTab>('scores');
  const inputRef = useRef<HTMLInputElement>(null);


  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(e.type === 'dragenter' || e.type === 'dragover');
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.name.toLowerCase().endsWith('.pdf')) { setFile(f); setError(null); }
    else setError('PDF 파일만 업로드 가능합니다.');
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setPhase('analyzing'); setError(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API_BASE_URL}/api/v1/upload-pdf`, fd,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 360000 });
      const r: Result = res.data;
      setResult(r);
      saveHistory(r);
      setPhase('results');
      setTab('scores');
    } catch (e: any) {
      setError(e.response?.data?.detail || '분석 오류. 백엔드 서버를 확인하세요.');
      setPhase('upload');
    }
  };

  const handleDownload = async (fmt: 'txt' | 'docx') => {
    if (!result) return; setDL(fmt);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/export`,
        { review: result.review, guidelines: result.guidelines, filename: result.filename, format: fmt },
        { responseType: 'blob', timeout: 60000 });
      const base = result.filename.replace(/\.[^.]+$/, '');
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${base}_논문평가종합평.${fmt}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert('다운로드 실패'); }
    finally { setDL(null); }
  };

  const handlePrint = () => {
    if (!result) return;
    const now = new Date().toLocaleString('ko-KR');
    const w = window.open('', '_blank');
    if (!w) { alert('팝업을 허용해 주세요.'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>논문 평가 종합평</title>
<style>@page{margin:2cm}body{font-family:'Malgun Gothic',sans-serif;color:#222;line-height:1.7;font-size:11pt}
h1{text-align:center;color:#1a1a3a;font-size:20pt;margin-top:60px}
h2{color:#2a2a5a;font-size:14pt;border-bottom:2px solid #ddd;padding-bottom:4px;margin-top:28px}
h3{color:#3a3a7a;font-size:12pt}
.meta{text-align:center;color:#888;font-size:9pt;margin:14px 0 50px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th{background:#eeeefc;font-weight:bold;padding:7px;border:1px solid #ccc}
td{padding:5px 8px;border:1px solid #ddd}
</style></head><body>
<h1>논문 평가 종합평</h1>
<p class="meta">분석 대상: ${result.filename} · 생성: ${now}</p>
<h2>종합 점수 요약</h2>
<table><tr><th>영역</th><th>환산 점수</th></tr>
<tr><td>A. 논리성 및 담론</td><td>${result.scores?.A ?? '—'}/30</td></tr>
<tr><td>B. 체계성 및 방법론</td><td>${result.scores?.B ?? '—'}/30</td></tr>
<tr><td>C. 독창성 및 기여</td><td>${result.scores?.C ?? '—'}/20</td></tr>
<tr><td>D. 반증성 및 한계</td><td>${result.scores?.D ?? '—'}/20</td></tr>
<tr><td><strong>총점</strong></td><td><strong>${result.scores?.total ?? '—'}/100</strong></td></tr>
</table>
<h2>논문 평가 종합평</h2>${mdToHtml(result.review)}
<h2>실행 과제 및 개선 전략</h2>${mdToHtml(result.guidelines)}
<script>window.onload=function(){window.print()}</script>
</body></html>`);
    w.document.close();
  };

  const fmtSize = (b: number) => b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

  // ── UPLOAD ─────────────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="upload" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="max-w-2xl mx-auto space-y-4">
          <div className={`relative rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden ${drag ? 'drop-zone-hover scale-[1.01]' : file ? 'drop-zone-active' : 'drop-zone-idle glass'}`}
            onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" className="hidden" accept=".pdf"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null); } }} />
            <div className="px-12 py-14 flex flex-col items-center text-center gap-5">
              {file ? (
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-2xl" style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}>
                    <FileText className="w-10 h-10 icon-glow-green" style={{ color: '#00ff94' }} />
                  </div>
                  <div><p className="font-bold text-white text-lg">{file.name}</p><p className="text-sm text-white/30 mt-0.5">{fmtSize(file.size)}</p></div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }} className="flex items-center gap-1 text-xs text-white/22 hover:text-red-400 transition-colors">
                    <XCircle className="w-3 h-3" /> 파일 제거
                  </button>
                </motion.div>
              ) : (
                <>
                  <motion.div animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="p-5 rounded-2xl" style={{ background: 'rgba(181,123,255,0.07)', border: '1px solid rgba(181,123,255,0.15)' }}>
                    <Upload className="w-10 h-10 icon-glow-purple" style={{ color: 'rgba(181,123,255,0.7)' }} />
                  </motion.div>
                  <div><p className="text-xl font-bold text-white mb-1">논문 PDF를 드래그하세요</p><p className="text-sm text-white/28">또는 클릭하여 파일 선택</p></div>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(181,123,255,0.5)' }}>
                    <Database className="w-3 h-3" /> 89개 참조 논문 + 4개 벤치마크 기준 상대 평가
                  </div>
                </>
              )}
            </div>
          </div>
          <AnimatePresence>
            {file && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex justify-center">
                <button onClick={handleAnalyze} className="btn-primary flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white text-base">
                  <BarChart3 className="w-5 h-5" /> AI 논문 심층 평가 시작
                  <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.3 }}><ArrowRight className="w-5 h-5" /></motion.div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass rounded-2xl p-4 flex items-start gap-3 text-sm"
                style={{ borderColor: 'rgba(255,51,85,0.25)', background: 'rgba(255,51,85,0.05)', color: '#ff3355' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 icon-glow-red" /><p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} className="grid grid-cols-3 gap-3 pt-2">
            {[
              { Icon: Search, glowClass: 'icon-glow-blue', color: '#38beff', title: '50개 체크리스트', desc: '4개 영역 체계적 평가' },
              { Icon: Database, glowClass: 'icon-glow-purple', color: '#b57bff', title: '89개 참조 기준선', desc: 'RAG 상대 비교 평가' },
              { Icon: ClipboardList, glowClass: 'icon-glow-green', color: '#00ff94', title: '실행 계획 생성', desc: '단계별 개선 전략' },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 + i * 0.08 }}
                className="glass glass-hover rounded-2xl p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-2.5 rounded-xl" style={{ background: `${c.color}11`, border: `1px solid ${c.color}22` }}>
                    <c.Icon className={`w-5 h-5 ${c.glowClass}`} style={{ color: c.color }} />
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80">{c.title}</p>
                <p className="text-[10.5px] text-white/28 mt-0.5">{c.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── ANALYZING ────────────────────────────────────────────────
  if (phase === 'analyzing') return <AnalyzingView filename={file?.name ?? ''} />;

  // ── RESULTS ──────────────────────────────────────────────────
  if (phase === 'results' && result) {
    const scores = result.scores ?? { A: 0, B: 0, C: 0, D: 0, total: 0 };
    const hasScore = scores.total > 0;
    const gi = hasScore ? getGradeInfo(scores.total) : null;
    const { GradeIcon } = gi ?? { GradeIcon: Minus };

    const TABS: { key: ResultTab; Icon: React.ElementType; label: string; glowClass: string; color: string }[] = [
      { key: 'scores', Icon: BarChart3, label: '점수 분석', glowClass: 'icon-glow-purple', color: '#b57bff' },
      { key: 'review', Icon: FileText, label: '종합평', glowClass: 'icon-glow-blue', color: '#38beff' },
      { key: 'guidelines', Icon: ListChecks, label: '개선 전략', glowClass: 'icon-glow-green', color: '#00ff94' },
      { key: 'chat', Icon: MessageSquare, label: 'AI Q&A', glowClass: 'icon-glow-purple', color: '#b57bff' },
      { key: 'rag', Icon: Database, label: '참조 논문', glowClass: 'icon-glow-blue', color: '#38beff' },
    ];

    return (
      <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-5xl mx-auto">

        {/* ── Summary Card ── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="glass rounded-3xl p-6">
          <div className="flex items-center gap-6">
            {/* Score Ring */}
            {hasScore && (
              <div className="relative flex-shrink-0">
                <ScoreRing score={scores.total} color={gi!.ringColor} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
                    className={`text-3xl font-black ${gi!.neonClass}`}>{scores.total}</motion.span>
                  <span className="text-[9px] text-white/25 tracking-wider uppercase mt-0.5">/ 100</span>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {gi && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${gi.borderClass} ${gi.bgClass}`}>
                    <GradeIcon className={`w-4 h-4 ${gi.iconGlowClass}`} style={{ color: gi.ringColor }} />
                    <span className={`text-sm font-bold ${gi.neonClass}`}>{gi.label}</span>
                  </div>
                )}
                <span className="rag-tag ml-auto"><Database className="w-2.5 h-2.5" /> RAG Enhanced</span>
              </div>
              <p className="font-semibold text-white/90 truncate text-sm">{result.filename}</p>
              <p className="text-[11px] text-white/25 mt-1">
                {result.total_pages}p · {result.text_length.toLocaleString()}자 분석됨
                {result.truncated && ' · 일부 생략'}
              </p>
              {/* Sub-scores chips */}
              {hasScore && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[{ k: 'A', label: '논리', c: '#38beff', max: 30 }, { k: 'B', label: '체계', c: '#b57bff', max: 30 }, { k: 'C', label: '독창', c: '#00ff94', max: 20 }, { k: 'D', label: '반증', c: '#ffe033', max: 20 }].map(d => (
                    <span key={d.k} className="text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums"
                      style={{ background: `${d.c}12`, border: `1px solid ${d.c}25`, color: d.c }}>
                      {d.label} {(typeof scores[d.k as keyof Scores] === 'number' ? scores[d.k as keyof Scores] as number : 0)}/{d.max}
                    </span>
                  ))}
                </div>
              )}
              {/* 추정 실패 안내 */}
              {!hasScore && !result.review.includes('리뷰 생성 오류') && (
                <p className="text-[10.5px] text-yellow-400/60 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  점수 파싱 실패 — 종합평 탭에서 AI 표를 직접 확인하세요
                </p>
              )}, {/* 리뷰 자체가 오류 */}
              {result.review.includes('리뷰 생성 오류') && (
                <p className="text-[10.5px] text-red-400/70 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  심층 평가 오류 — 백엔드 로그를 확인하세요
                </p>
              )}
            </div>
            <button onClick={() => { setPhase('upload'); setFile(null); setResult(null); setTab('scores'); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-white/30 hover:text-white glass glass-hover transition-all font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> 새 논문
            </button>
          </div>

          {/* Export */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/[0.05]">
            <span className="text-[10px] text-white/20 mr-1 uppercase tracking-widest">Export</span>
            {(['txt', 'docx'] as const).map(fmt => (
              <button key={fmt} onClick={() => handleDownload(fmt)} disabled={downloading !== null}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border uppercase tracking-wider transition-all
                  ${downloading === fmt ? 'border-purple-500/35 bg-purple-500/10 text-purple-300 cursor-wait' : 'border-white/7 bg-white/3 text-white/40 hover:bg-white/7 hover:text-white hover:border-white/14'}
                  ${downloading && downloading !== fmt ? 'opacity-35 cursor-not-allowed' : ''}`}>
                {downloading === fmt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}{fmt}
              </button>
            ))}
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/7 bg-white/3 text-white/40 hover:bg-white/7 hover:text-white hover:border-white/14 uppercase tracking-wider transition-all">
              <Printer className="w-3 h-3" /> Print PDF
            </button>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex gap-1.5 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${tab === t.key ? 'tab-active' : 'tab-inactive glass'}`}>
              <t.Icon className={`w-3.5 h-3.5 ${tab === t.key ? t.glowClass : ''}`} style={{ color: tab === t.key ? t.color : undefined }} />
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ── Content Panel ── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="glass rounded-3xl overflow-hidden">

            {/* Panel header */}
            <div className="px-7 py-4 flex items-center justify-between"
              style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              {(() => {
                const t = TABS.find(x => x.key === tab)!; return (
                  <div className="flex items-center gap-2">
                    <t.Icon className={`w-4 h-4 ${t.glowClass}`} style={{ color: t.color }} />
                    <span className="font-bold text-sm" style={{ color: t.color }}>{t.label}</span>
                  </div>
                );
              })()}
              <span className="rag-tag"><Database className="w-2.5 h-2.5" /> RAG 기반</span>
            </div>

            {/* Tab content */}
            {tab === 'scores' && hasScore && <ScoresPanel scores={scores} />}
            {tab === 'scores' && !hasScore && (
              <div className="p-10 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,224,51,0.07)', border: '1px solid rgba(255,224,51,0.18)', color: '#ffe033' }}>
                  <AlertCircle className="w-4 h-4" />
                  <span>점수 파싱에 실패했습니다</span>
                </div>
                <p className="text-white/30 text-sm">
                  {result.review.includes('리뷰 생성 오류')
                    ? '리뷰 자체가 실패했습니다. 아래 오류 내용을 확인하세요.'
                    : 'AI가 표준 형식으로 점수를 출력하지 않았습니다. 종합평 탭에서 표를 직접 확인해주세요.'}
                </p>
                <button onClick={() => setTab('review')}
                  className="text-sm px-5 py-2 rounded-xl font-semibold border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/8 transition-all">
                  → 종합평 탭에서 확인
                </button>
              </div>
            )}
            {(tab === 'review' || tab === 'guidelines') && (
              <div className="p-8">
                <div className="markdown-content">
                  <ReactMarkdown>{tab === 'review' ? result.review : result.guidelines}</ReactMarkdown>
                </div>
              </div>
            )}
            {tab === 'chat' && <ChatPanel review={result.review} guidelines={result.guidelines} />}
            {tab === 'rag' && <RagPapersPanel papers={result.rag_papers ?? []} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }
  return null;
}
