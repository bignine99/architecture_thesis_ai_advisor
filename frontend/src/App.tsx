import { useState, useEffect } from 'react'
import AnalysisView from './views/AnalysisView'
import LandingPage from './views/LandingPage'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Database, AlertTriangle, Clock, Wifi,
  ChevronRight, Trash2, BarChart3,
  ShieldCheck, ShieldQuestion, ShieldAlert, ShieldX, Minus,
  Sun, Moon,
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const HISTORY_KEY = 'thesis_eval_history'

// ─── Types ────────────────────────────────────────────────────
interface Scores { A: number; B: number; C: number; D: number; total: number }
interface HistoryEntry {
  filename: string; total_pages: number; text_length: number; truncated: boolean;
  review: string; guidelines: string; scores: Scores; rag_papers: any[];
  savedAt: string;
}

// ─── RAG Status Badge ─────────────────────────────────────────
interface RagStatus {
  connected: boolean
  reference: { connected: boolean; chunk_count: number; label: string }
  benchmark: { connected: boolean; chunk_count: number; label: string }
}
function RagStatusBadge() {
  const [status, setStatus] = useState<RagStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/v1/rag-status`, { signal: AbortSignal.timeout(4000) })
        if (r.ok) setStatus(await r.json())
        else setStatus(null)
      } catch { setStatus(null) }
      finally { setLoading(false) }
    }
    fetch_(); const t = setInterval(fetch_, 30000); return () => clearInterval(t)
  }, [])

  const ok = status?.connected === true
  return (
    <div className="relative" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 220 }}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide cursor-default select-none border transition-all duration-500
          ${loading ? 'border-white/8 bg-white/3 text-white/25' : ok ? 'rag-badge-connected neon-green' : 'border-red-500/25 bg-red-500/6 text-red-400'}`}>
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          {!loading && ok && <span className="animate-ping absolute inset-0 rounded-full bg-[#00ff94] opacity-70" />}
          <span className={`relative rounded-full h-1.5 w-1.5 ${loading ? 'bg-white/15' : ok ? 'bg-[#00ff94]' : 'bg-red-400'}`} />
        </span>
        <Database className={`w-3 h-3 ${ok ? 'icon-glow-green' : ''}`} style={{ color: 'inherit' }} />
        <span className="tracking-wider uppercase" style={{ fontSize: '0.68rem' }}>
          {loading ? 'Connecting...' : ok ? 'RAG Connected' : 'RAG Offline'}
        </span>
      </motion.div>
      <AnimatePresence>
        {showTip && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-3 z-50 glass rounded-2xl shadow-2xl shadow-black/70 p-4 w-72 pointer-events-none text-xs">
            <p className="font-bold text-white mb-3 flex items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
              <Database className="w-3.5 h-3.5 icon-glow-purple" style={{ color: '#b57bff' }} />
              <span className="neon-purple">RAG Database Status</span>
            </p>
            {[
              { label: '참조 논문 DB', st: status?.reference, sub: '80~85점 기준선' },
              { label: '벤치마크 DB', st: status?.benchmark, sub: '실제 심사 점수' },
            ].map((row, i) => (
              <div key={i} className="flex gap-2.5 mb-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${row.st?.connected ? 'bg-[#00ff94]' : 'bg-white/15'}`} />
                <div>
                  <p className="text-white/70 font-medium">{row.label}</p>
                  <p className="text-white/30 mt-0.5 text-[0.67rem]">
                    {row.st?.connected
                      ? `${row.st.chunk_count > 0 ? row.st.chunk_count.toLocaleString() + ' 청크' : '연결됨'} · ${row.sub}`
                      : '미연결'}
                  </p>
                </div>
              </div>
            ))}
            {!ok && (
              <div className="mt-3 pt-3 border-t border-white/6 flex gap-1.5 text-yellow-400/70 text-[0.67rem]">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <p>백엔드 서버가 실행 중인지 확인하세요.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Grade helpers ────────────────────────────────────────────
function gradeIcon(total: number) {
  if (total >= 85) return { Icon: ShieldCheck, color: '#38beff', label: '조건부 통과' }
  if (total >= 70) return { Icon: ShieldQuestion, color: '#ffe033', label: '수정 후 재심' }
  if (total >= 51) return { Icon: ShieldAlert, color: '#ff8c42', label: '대폭 수정' }
  if (total > 0) return { Icon: ShieldX, color: '#ff3355', label: '평가 불가' }
  return { Icon: Minus, color: 'rgba(255,255,255,0.2)', label: '—' }
}

// ─── History Tab ──────────────────────────────────────────────
function HistoryView({ onRestore }: { onRestore: (entry: HistoryEntry) => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [compare, setCompare] = useState<HistoryEntry[]>([])

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      setHistory(raw)
    } catch { setHistory([]) }
  }, [])

  const _remove = (idx: number) => {
    const next = history.filter((_, i) => i !== idx)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    setCompare(compare.filter(c => history.indexOf(c) !== idx))
  }
  const clearAll = () => { setHistory([]); setCompare([]); localStorage.removeItem(HISTORY_KEY) }

  const toggleCompare = (entry: HistoryEntry) => {
    setCompare(prev => {
      if (prev.includes(entry)) return prev.filter(c => c !== entry)
      if (prev.length >= 2) return [prev[1], entry]
      return [...prev, entry]
    })
  }

  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="glass rounded-3xl p-14 text-center max-w-sm">
          <Clock className="w-10 h-10 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-white/35 font-semibold">평가 이력이 없습니다</p>
          <p className="text-white/18 text-xs mt-1.5">논문을 업로드하면 자동으로 저장됩니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compare panel */}
      <AnimatePresence>
        {compare.length === 2 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass rounded-3xl p-6 neon-purple-border neon-purple-bg">
            <h3 className="text-sm font-bold neon-purple mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 icon-glow-purple" /> 비교 분석
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {compare.map((e, i) => {
                const gi = gradeIcon(e.scores?.total ?? 0)
                const delta = i === 1 && compare[0] ? ((e.scores?.total ?? 0) - (compare[0].scores?.total ?? 0)) : null
                return (
                  <div key={i} className="space-y-3">
                    <p className="text-xs text-white/40 font-semibold">{i === 0 ? 'Ver. 1' : 'Ver. 2'}</p>
                    <p className="text-sm font-bold text-white truncate">{e.filename}</p>
                    <div className="flex items-center gap-2">
                      <gi.Icon className="w-4 h-4" style={{ color: gi.color, filter: `drop-shadow(0 0 5px ${gi.color}88)` }} />
                      <span className="text-2xl font-black tabular-nums" style={{ color: gi.color }}>{e.scores?.total ?? '—'}</span>
                      <span className="text-white/25 text-xs">/ 100</span>
                      {delta !== null && (
                        <span className={`text-sm font-bold ml-1 ${delta > 0 ? 'neon-green' : delta < 0 ? 'neon-red' : 'text-white/30'}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </div>
                    {/* sub-scores */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['A', 'B', 'C', 'D'] as const).map(k => {
                        const max = { A: 30, B: 30, C: 20, D: 20 }[k]
                        const sc = e.scores?.[k] ?? 0
                        const other = compare[i === 0 ? 1 : 0]?.scores?.[k] ?? 0
                        const better = i === 1 && sc > other, worse = i === 1 && sc < other
                        return (
                          <div key={k} className="flex items-center justify-between px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <span className="text-[10px] text-white/35 font-bold">{k}</span>
                            <span className={`text-xs font-bold tabular-nums ${better ? 'neon-green' : worse ? 'neon-red' : 'text-white/55'}`}>
                              {sc}/{max}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-white/20">{new Date(e.savedAt).toLocaleString('ko-KR')}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white/25 uppercase tracking-widest">
          평가 이력 {history.length}건 · {compare.length > 0 && `${compare.length}개 선택됨`}
        </p>
        <button onClick={clearAll} className="text-[11px] text-white/20 hover:text-red-400 flex items-center gap-1 transition-colors">
          <Trash2 className="w-3 h-3" /> 전체 삭제
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {history.map((entry, i) => {
          const gi = gradeIcon(entry.scores?.total ?? 0)
          const isSelected = compare.includes(entry)
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => toggleCompare(entry)}
              className={`glass glass-hover rounded-2xl p-5 cursor-pointer transition-all duration-200
                ${isSelected ? 'neon-purple-border neon-purple-bg scale-[1.01]' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/85 truncate mb-1">{entry.filename}</p>
                  <p className="text-[10.5px] text-white/25">{entry.total_pages}p · {new Date(entry.savedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <gi.Icon className="w-4 h-4" style={{ color: gi.color, filter: `drop-shadow(0 0 5px ${gi.color}88)` }} />
                    <span className="text-xl font-black tabular-nums" style={{ color: gi.color }}>{entry.scores?.total ?? '—'}</span>
                  </div>
                  <span className="text-[9px] text-white/25">{gi.label}</span>
                </div>
              </div>
              {/* Sub-score row */}
              {entry.scores?.total > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {(['A', 'B', 'C', 'D'] as const).map(k => {
                    const max = { A: 30, B: 30, C: 20, D: 20 }[k]
                    const col = { A: '#38beff', B: '#b57bff', C: '#00ff94', D: '#ffe033' }[k]
                    return (
                      <span key={k} className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold tabular-nums"
                        style={{ background: `${col}12`, border: `1px solid ${col}25`, color: col }}>
                        {k} {entry.scores[k]}/{max}
                      </span>
                    )
                  })}
                </div>
              )}
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                <span className="text-[10px] text-white/20">
                  {isSelected ? '✓ 비교 선택됨' : '클릭하여 비교 선택'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onRestore(entry); }}
                  className="flex items-center gap-1 text-[10.5px] text-white/35 hover:text-purple-400 transition-colors font-medium">
                  상세 보기 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<'upload' | 'history'>('upload')
  const [restored, setRestored] = useState<any>(null)
  const [showLanding, setShowLanding] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('thesis_theme') as 'light' | 'dark') ?? 'dark'
  })

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('thesis_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const handleRestore = (entry: HistoryEntry) => {
    setRestored(entry)
    setTab('upload')
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showLanding && (
          <LandingPage key="landing" onEnter={() => setShowLanding(false)} />
        )}
      </AnimatePresence>

      {!showLanding && (
        <div className="min-h-screen relative">
          <div className="bg-mesh" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          {/* ── Header ── */}
          <header className="sticky top-0 z-50 header-glass">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: '60px' }}>
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                {/* Back to Landing */}
                <button
                  onClick={() => setShowLanding(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
                  title="랜딩페이지로 이동"
                >
                  ← Home
                </button>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl blur-md opacity-40" />
                  <div className="relative p-2.5 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-bold gradient-text tracking-tight leading-none">
                    Architectural Thesis Advisor AI
                  </h1>
                  <p className="tracking-widest uppercase" style={{ fontSize: '0.6rem', marginTop: '2px', color: 'var(--text-faint)' }}>
                    AI · Critical Review &amp; RAG Evaluation
                  </p>
                </div>
              </motion.div>
              <div className="flex items-center gap-3">
                <RagStatusBadge />
                <div className="w-px h-4" style={{ background: 'var(--divider)' }} />
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="theme-toggle rounded-lg"
                  title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
                >
                  {theme === 'light'
                    ? <Moon className="w-4 h-4" />
                    : <Sun className="w-4 h-4" />}
                </button>
                <div className="w-px h-4" style={{ background: 'var(--divider)' }} />
                <nav className="flex gap-1">
                  {(['upload', 'history'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold border tracking-wide transition-all duration-200
                    ${tab === t ? 'tab-active' : 'tab-inactive glass'}`}>
                      {t === 'upload' ? 'Upload' : 'History'}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
            <AnimatePresence mode="wait">
              {tab === 'upload' ? (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                  {/* Hero */}
                  <div className="text-center pt-16 pb-10">
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                      <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border"
                        style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-soft)' }}>
                        <Wifi className="w-3 h-3 icon-glow-purple" style={{ color: 'var(--accent-text)' }} />
                        <span className="text-[0.68rem] font-semibold tracking-widest uppercase"
                          style={{ color: 'var(--accent-text)' }}>
                          AI · 2-Stage Review · RAG Enhanced
                        </span>
                      </div>
                      <h2 className="text-[3.2rem] font-black tracking-tight leading-[1.08] mb-4">
                        <span className="gradient-text">Elevate Your</span><br />
                        <span className="gradient-text-purple">Architectural Thesis</span>
                      </h2>
                      <p className="text-base max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        논문을 업로드하면 AI가 50개 기준으로 심층 평가하고<br />
                        <span style={{ color: 'var(--text-base)' }}>89개 참조 논문</span>과 비교해 개선 방향을 제시합니다.
                      </p>
                    </motion.div>
                  </div>
                  <AnalysisView key={restored?.savedAt ?? 'new'} initialResult={restored} onClear={() => setRestored(null)} />
                </motion.div>
              ) : (
                <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                  <div className="pt-12 pb-8">
                    <h2 className="text-2xl font-black gradient-text mb-1">평가 이력</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>클릭하여 최대 2개 논문 비교 · 상세 보기로 결과 복원</p>
                  </div>
                  <HistoryView onRestore={handleRestore} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </>
  )
}
