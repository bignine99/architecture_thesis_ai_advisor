import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    ArrowRight, CheckCircle2,
    MessageSquare, FileText, Zap, Shield, Target,
    ChevronRight, TrendingUp, Database, ExternalLink, Lock, GraduationCap,
} from 'lucide-react';

interface Props { onEnter: () => void }

/* ─── Count-up Number ─────────────────────────────────────── */
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

/* ─── Section Label ───────────────────────────────────────── */
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

/* ─── Floating Academic Icons Background ──────────────────── */

/* Academic icon SVG components (48×48 viewBox, thin stroke outline style) */
function AcademicIcon({ type, size, color, opacity }: {
    type: string; size: number; color: string; opacity: number;
}) {
    const sw = 2;   // strokeWidth
    const base = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

    /* ── Graduation Cap ── */
    if (type === 'graduation') return (
        <svg width={size} height={size * 0.85} viewBox="0 0 56 48" fill="none" opacity={opacity}>
            {/* Mortarboard board */}
            <polygon points="28,4 54,16 28,28 2,16" {...base} />
            {/* Cap body */}
            <path d="M10,20 L10,34 C10,41 46,41 46,34 L46,20" {...base} />
            {/* Tassel cord */}
            <line x1="54" y1="16" x2="54" y2="30" {...base} />
            <circle cx="54" cy="33" r="3" fill={color} opacity={opacity} />
        </svg>
    );

    /* ── Open Book ── */
    if (type === 'book') return (
        <svg width={size} height={size * 0.9} viewBox="0 0 56 50" fill="none" opacity={opacity}>
            {/* Left page */}
            <path d="M28,8 L28,44 L4,42 L4,10 Q4,8 6,8 Z" {...base} />
            {/* Right page */}
            <path d="M28,8 L28,44 L52,42 L52,10 Q52,8 50,8 Z" {...base} />
            {/* Text lines left */}
            <line x1="8" y1="16" x2="24" y2="16" {...base} strokeWidth={1.4} />
            <line x1="8" y1="22" x2="24" y2="22" {...base} strokeWidth={1.4} />
            <line x1="8" y1="28" x2="24" y2="28" {...base} strokeWidth={1.4} />
            <line x1="8" y1="34" x2="20" y2="34" {...base} strokeWidth={1.4} />
            {/* Text lines right */}
            <line x1="32" y1="16" x2="48" y2="16" {...base} strokeWidth={1.4} />
            <line x1="32" y1="22" x2="48" y2="22" {...base} strokeWidth={1.4} />
            <line x1="32" y1="28" x2="48" y2="28" {...base} strokeWidth={1.4} />
            <line x1="32" y1="34" x2="44" y2="34" {...base} strokeWidth={1.4} />
        </svg>
    );

    /* ── Globe ── */
    if (type === 'globe') return (
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none" opacity={opacity}>
            <circle cx="28" cy="28" r="24" {...base} />
            {/* Vertical axis */}
            <line x1="28" y1="4" x2="28" y2="52" {...base} />
            {/* Equator */}
            <ellipse cx="28" cy="28" rx="24" ry="9" {...base} />
            {/* Top latitude */}
            <path d="M10,18 Q28,13 46,18" {...base} strokeWidth={1.4} />
            {/* Bottom latitude */}
            <path d="M10,38 Q28,43 46,38" {...base} strokeWidth={1.4} />
        </svg>
    );

    /* ── Light Bulb ── */
    if (type === 'bulb') return (
        <svg width={size * 0.85} height={size} viewBox="0 0 46 56" fill="none" opacity={opacity}>
            <path d="M16,34 C8,29 6,22 6,18 C6,9 14,2 23,2 C32,2 40,9 40,18 C40,22 38,29 30,34 L30,38 L16,38 Z" {...base} />
            <line x1="16" y1="38" x2="30" y2="38" {...base} />
            <line x1="17" y1="43" x2="29" y2="43" {...base} />
            <line x1="19" y1="48" x2="27" y2="48" {...base} />
            {/* Inner glow cross */}
            <line x1="23" y1="10" x2="23" y2="26" {...base} strokeWidth={1.3} />
            <line x1="15" y1="18" x2="31" y2="18" {...base} strokeWidth={1.3} />
        </svg>
    );

    /* ── Trophy ── */
    if (type === 'trophy') return (
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none" opacity={opacity}>
            {/* Cup body */}
            <path d="M14,6 L14,28 Q14,42 28,42 Q42,42 42,28 L42,6 Z" {...base} />
            {/* Left handle */}
            <path d="M14,12 Q4,12 4,22 Q4,32 14,32" {...base} />
            {/* Right handle */}
            <path d="M42,12 Q52,12 52,22 Q52,32 42,32" {...base} />
            {/* Base column */}
            <line x1="28" y1="42" x2="28" y2="50" {...base} />
            {/* Base plate */}
            <line x1="16" y1="50" x2="40" y2="50" {...base} />
            {/* Star */}
            <polygon points="28,14 30,20 36,20 31,24 33,30 28,26 23,30 25,24 20,20 26,20" {...base} strokeWidth={1.3} />
        </svg>
    );

    /* ── Pencil + Ruler (crossed) ── */
    if (type === 'pencilruler') return (
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none" opacity={opacity}>
            {/* Pencil (top-left to bottom-right) */}
            <rect x="8" y="21" width="9" height="30" rx="1.5" transform="rotate(-40 28 28)" {...base} />
            <polygon points="28,48 32,40 24,40" transform="rotate(-40 28 28) translate(-4,5)" {...base} strokeWidth={1.3} />
            {/* Ruler (top-right to bottom-left) */}
            <rect x="39" y="21" width="9" height="30" rx="1.5" transform="rotate(40 28 28)" {...base} />
            {/* Ruler ticks */}
            <line x1="41" y1="24" x2="44" y2="24" transform="rotate(40 28 28)" {...base} strokeWidth={1.2} />
            <line x1="41" y1="29" x2="46" y2="29" transform="rotate(40 28 28)" {...base} strokeWidth={1.2} />
            <line x1="41" y1="34" x2="44" y2="34" transform="rotate(40 28 28)" {...base} strokeWidth={1.2} />
            <line x1="41" y1="39" x2="46" y2="39" transform="rotate(40 28 28)" {...base} strokeWidth={1.2} />
        </svg>
    );

    /* ── Medal ── */
    if (type === 'medal') return (
        <svg width={size * 0.8} height={size} viewBox="0 0 44 56" fill="none" opacity={opacity}>
            {/* Ribbon left */}
            <path d="M22,4 L12,20" {...base} strokeWidth={2.5} />
            {/* Ribbon right */}
            <path d="M22,4 L32,20" {...base} strokeWidth={2.5} />
            {/* Circle medal */}
            <circle cx="22" cy="36" r="18" {...base} />
            {/* Inner circle */}
            <circle cx="22" cy="36" r="12" {...base} strokeWidth={1.3} />
            {/* "1" inside */}
            <text x="22" y="41" textAnchor="middle" fontSize="14" fontWeight="bold"
                fill={color} opacity={opacity} stroke="none">1</text>
        </svg>
    );

    /* ── Microscope ── */
    if (type === 'microscope') return (
        <svg width={size * 0.85} height={size} viewBox="0 0 46 56" fill="none" opacity={opacity}>
            {/* Eyepiece tube */}
            <rect x="18" y="2" width="10" height="14" rx="2" {...base} />
            {/* Arm */}
            <path d="M23,16 L23,34" {...base} strokeWidth={2.5} />
            {/* Objective lens */}
            <rect x="18" y="28" width="10" height="8" rx="2" {...base} />
            {/* Stage */}
            <rect x="8" y="36" width="30" height="4" rx="1" {...base} />
            {/* Sample slide */}
            <line x1="12" y1="36" x2="34" y2="36" {...base} strokeWidth={1.3} />
            {/* Base */}
            <path d="M4,54 Q23,44 42,54" {...base} />
            {/* Mirror */}
            <ellipse cx="23" cy="50" rx="6" ry="3" {...base} strokeWidth={1.3} />
        </svg>
    );

    /* ── Magnifying Glass ── */
    if (type === 'magnify') return (
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none" opacity={opacity}>
            <circle cx="22" cy="22" r="17" {...base} />
            <circle cx="22" cy="22" r="10" {...base} strokeWidth={1.3} />
            <line x1="34" y1="34" x2="52" y2="52" {...base} strokeWidth={3} strokeLinecap="round" />
        </svg>
    );

    /* ── Brain ── */
    if (type === 'brain') return (
        <svg width={size} height={size * 0.9} viewBox="0 0 56 50" fill="none" opacity={opacity}>
            {/* Left hemisphere */}
            <path d="M28,8 C28,8 18,6 12,10 C6,14 4,20 6,26 C8,32 10,36 14,38 C18,40 24,40 28,40"
                {...base} />
            {/* Right hemisphere */}
            <path d="M28,8 C28,8 38,6 44,10 C50,14 52,20 50,26 C48,32 46,36 42,38 C38,40 32,40 28,40"
                {...base} />
            {/* Center divide */}
            <line x1="28" y1="8" x2="28" y2="40" {...base} strokeWidth={1.3} />
            {/* Brain folds left */}
            <path d="M12,20 Q18,16 16,24 Q14,28 20,26" {...base} strokeWidth={1.3} />
            <path d="M10,30 Q16,28 14,34" {...base} strokeWidth={1.3} />
            {/* Brain folds right */}
            <path d="M44,20 Q38,16 40,24 Q42,28 36,26" {...base} strokeWidth={1.3} />
            <path d="M46,30 Q40,28 42,34" {...base} strokeWidth={1.3} />
        </svg>
    );

    /* ── Stacked Books ── */
    if (type === 'books') return (
        <svg width={size} height={size * 0.85} viewBox="0 0 56 48" fill="none" opacity={opacity}>
            {/* Book 1 (bottom) */}
            <rect x="4" y="36" width="48" height="10" rx="1.5" {...base} />
            <line x1="10" y1="36" x2="10" y2="46" {...base} strokeWidth={1.3} />
            {/* Book 2 (middle) */}
            <rect x="6" y="24" width="44" height="10" rx="1.5" {...base} />
            <line x1="12" y1="24" x2="12" y2="34" {...base} strokeWidth={1.3} />
            {/* Book 3 (top) */}
            <rect x="8" y="12" width="40" height="10" rx="1.5" {...base} />
            <line x1="14" y1="12" x2="14" y2="22" {...base} strokeWidth={1.3} />
            {/* Book 4 (smallest, top) */}
            <rect x="12" y="2" width="32" height="8" rx="1.5" {...base} />
        </svg>
    );

    /* ── Scroll / Certificate ── */
    if (type === 'scroll') return (
        <svg width={size} height={size * 0.8} viewBox="0 0 56 44" fill="none" opacity={opacity}>
            {/* Main scroll body */}
            <rect x="8" y="6" width="40" height="32" rx="2" {...base} />
            {/* Top rolled edge */}
            <ellipse cx="28" cy="6" rx="20" ry="5" {...base} />
            {/* Bottom rolled edge */}
            <ellipse cx="28" cy="38" rx="20" ry="5" {...base} />
            {/* Text lines */}
            <line x1="14" y1="16" x2="42" y2="16" {...base} strokeWidth={1.3} />
            <line x1="14" y1="22" x2="42" y2="22" {...base} strokeWidth={1.3} />
            <line x1="14" y1="28" x2="36" y2="28" {...base} strokeWidth={1.3} />
            {/* Ribbon/seal */}
            <circle cx="28" cy="34" r="5" {...base} strokeWidth={1.3} />
        </svg>
    );

    /* ── Compass (Drafting) ── */
    if (type === 'compass') return (
        <svg width={size * 0.7} height={size} viewBox="0 0 38 56" fill="none" opacity={opacity}>
            {/* Left leg */}
            <line x1="19" y1="8" x2="6" y2="54" {...base} />
            {/* Right leg */}
            <line x1="19" y1="8" x2="32" y2="54" {...base} />
            {/* Hinge circle */}
            <circle cx="19" cy="8" r="5" {...base} />
            {/* Crossbar */}
            <line x1="10" y1="26" x2="28" y2="26" {...base} strokeWidth={1.4} />
            {/* Left point */}
            <circle cx="6" cy="54" r="2" fill={color} opacity={opacity} />
            {/* Right pen nib */}
            <path d="M29,52 L32,56 L35,52 L32,48 Z" {...base} strokeWidth={1.3} />
        </svg>
    );

    /* ── Owl (Wisdom) ── */
    if (type === 'owl') return (
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none" opacity={opacity}>
            {/* Body */}
            <ellipse cx="28" cy="32" rx="18" ry="20" {...base} />
            {/* Head */}
            <ellipse cx="28" cy="16" rx="14" ry="12" {...base} />
            {/* Left ear tuft */}
            <path d="M18,8 L14,2 L20,6" {...base} strokeWidth={1.3} />
            {/* Right ear tuft */}
            <path d="M38,8 L42,2 L36,6" {...base} strokeWidth={1.3} />
            {/* Left eye */}
            <circle cx="22" cy="16" r="5" {...base} />
            <circle cx="22" cy="16" r="2.5" fill={color} opacity={opacity * 0.7} />
            {/* Right eye */}
            <circle cx="34" cy="16" r="5" {...base} />
            <circle cx="34" cy="16" r="2.5" fill={color} opacity={opacity * 0.7} />
            {/* Beak */}
            <path d="M25,22 L28,26 L31,22" {...base} strokeWidth={1.3} />
            {/* Wing lines */}
            <path d="M12,34 Q10,28 14,24" {...base} strokeWidth={1.3} />
            <path d="M44,34 Q46,28 42,24" {...base} strokeWidth={1.3} />
            {/* Feet */}
            <path d="M20,50 L18,54 M20,50 L22,54 M20,50 L24,54" {...base} strokeWidth={1.3} />
            <path d="M36,50 L34,54 M36,50 L38,54 M36,50 L32,54" {...base} strokeWidth={1.3} />
        </svg>
    );

    return null;
}

/* Positions & properties for each floating icon */
const ACADEMIC_ICONS = [
    { type: 'graduation', x: 4, y: 7, s: 72, o: 0.18, d: 9, c: '#a78bfa', dl: 0, ry: [-100, 100, -100], rx: [-50, 50, -50], rr: [-20, 20, -20] },
    { type: 'book', x: 88, y: 5, s: 66, o: 0.17, d: 11, c: '#60a5fa', dl: 1.2, ry: [-90, 90, -90], rx: [-45, 45, -45], rr: [-15, 15, -15] },
    { type: 'globe', x: 80, y: 38, s: 68, o: 0.16, d: 13, c: '#a78bfa', dl: 0.5, ry: [-80, 80, -80], rx: [-40, 40, -40], rr: [0, 0, 0] },
    { type: 'bulb', x: 12, y: 42, s: 60, o: 0.17, d: 10, c: '#fbbf24', dl: 2, ry: [-110, 110, -110], rx: [-55, 55, -55], rr: [-18, 18, -18] },
    { type: 'trophy', x: 86, y: 70, s: 64, o: 0.16, d: 12, c: '#fbbf24', dl: 3, ry: [-85, 85, -85], rx: [-42, 42, -42], rr: [-12, 12, -12] },
    { type: 'pencilruler', x: 58, y: 8, s: 62, o: 0.17, d: 8, c: '#34d399', dl: 0.3, ry: [-120, 120, -120], rx: [-60, 60, -60], rr: [-25, 25, -25] },
    { type: 'medal', x: 22, y: 78, s: 58, o: 0.17, d: 14, c: '#f472b6', dl: 2.5, ry: [-95, 95, -95], rx: [-48, 48, -48], rr: [-16, 16, -16] },
    { type: 'microscope', x: 45, y: 86, s: 64, o: 0.16, d: 11, c: '#60a5fa', dl: 3.5, ry: [-80, 80, -80], rx: [-40, 40, -40], rr: [-10, 10, -10] },
    { type: 'magnify', x: 70, y: 76, s: 60, o: 0.17, d: 9, c: '#a78bfa', dl: 4, ry: [-105, 105, -105], rx: [-52, 52, -52], rr: [-22, 22, -22] },
    { type: 'brain', x: 48, y: 18, s: 64, o: 0.16, d: 12, c: '#f472b6', dl: 0.8, ry: [-90, 90, -90], rx: [-45, 45, -45], rr: [-14, 14, -14] },
    { type: 'books', x: 5, y: 68, s: 66, o: 0.17, d: 10, c: '#34d399', dl: 1.5, ry: [-100, 100, -100], rx: [-50, 50, -50], rr: [-18, 18, -18] },
    { type: 'scroll', x: 92, y: 50, s: 60, o: 0.16, d: 13, c: '#34d399', dl: 4.5, ry: [-85, 85, -85], rx: [-42, 42, -42], rr: [-12, 12, -12] },
    { type: 'compass', x: 33, y: 3, s: 58, o: 0.17, d: 8, c: '#60a5fa', dl: 1.8, ry: [-115, 115, -115], rx: [-58, 58, -58], rr: [-28, 28, -28] },
    { type: 'owl', x: 62, y: 55, s: 62, o: 0.15, d: 11, c: '#fbbf24', dl: 2.2, ry: [-90, 90, -90], rx: [-45, 45, -45], rr: [-10, 10, -10] },
];

function FloatingShapes() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
            {ACADEMIC_ICONS.map((sh, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${sh.x}%`, top: `${sh.y}%` }}
                    animate={{ y: sh.ry, x: sh.rx, rotate: sh.rr }}
                    transition={{
                        duration: sh.d,
                        delay: sh.dl,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <AcademicIcon type={sh.type} size={sh.s} color={sh.c} opacity={sh.o} />
                </motion.div>
            ))}
        </div>
    );
}

/* ─── Pipeline Stage Card ─────────────────────────────────── */
function PipeStage({ n, title, sub, color, delay }: {
    n: string; title: string; sub: string; color: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col"
        >
            <div className="text-[0.6rem] font-black tracking-widest mb-2.5" style={{ color }}>
                {n}
            </div>
            <div
                className="flex-1 rounded-lg p-5 relative overflow-hidden group transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${color}25` }}
            >
                <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
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

/* ─── Capability Row ──────────────────────────────────────── */
function CapRow({ icon: Icon, color, title, desc, delay }: {
    icon: React.ElementType; color: string; title: string; desc: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-4 py-6 group"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
            <div
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{ background: `${color}10`, border: `1px solid ${color}25` }}
            >
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

/* ─── Score Bar ───────────────────────────────────────────── */
function ScoreBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'rgba(255,255,255,0.50)' }}>{label}</span>
                <span className="font-bold tabular-nums" style={{ color }}>
                    {val}<span style={{ color: 'rgba(255,255,255,0.28)' }}>/{max}</span>
                </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(val / max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.2, ease: [0.34, 1.1, 0.64, 1] }}
                />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage({ onEnter }: Props) {

    /* ── Password gate ── */
    const [showModal, setShowModal] = useState(false);
    const [pw, setPw] = useState('');
    const [pwError, setPwError] = useState(false);
    const [shaking, setShaking] = useState(false);

    function handlePwSubmit() {
        if (pw === 'dongguk') {
            setShowModal(false);
            setPw('');
            setPwError(false);
            onEnter();
        } else {
            setPwError(true);
            setShaking(true);
            setTimeout(() => setShaking(false), 600);
        }
    }

    const stages = [
        { n: 'STAGE 01', title: 'PDF 텍스트 추출', sub: '논문 전문을 청크 단위로 분해하고 구조를 파악합니다.', color: '#a78bfa' },
        { n: 'STAGE 02', title: 'RAG 벡터 검색', sub: '89편 논문 DB에서 관련 맥락을 Cosine 유사도로 검색합니다.', color: '#60a5fa' },
        { n: 'STAGE 03', title: '1차: 관찰 체크리스트', sub: '50개 항목을 가치판단 없이 사실 확인 방식으로 관찰합니다.', color: '#34d399' },
        { n: 'STAGE 04', title: '2차: 근거 기반 채점', sub: '관찰 결과만을 근거로 4개 영역 100점 만점으로 환산합니다.', color: '#fbbf24' },
        { n: 'STAGE 05', title: '종합 보고서 출력', sub: '총평·강점·개선사항·논증 강화 제안을 구조화하여 출력합니다.', color: '#f472b6' },
    ];

    const caps = [
        {
            icon: Target, color: '#a78bfa', title: '50개 항목 체계적 심사',
            desc: '논리성(15)·체계성(15)·독창성(10)·반증성(10) 4개 영역을 국제 동료심사 기준으로 빠짐없이 검토합니다.'
        },
        {
            icon: Database, color: '#60a5fa', title: '89편 최우수 논문과 실시간 비교',
            desc: '건축학 우수 논문 89편 + 벤치마크 4편으로 구축한 벡터 DB가 내 논문의 상대적 위치를 정확히 파악합니다.'
        },
        {
            icon: Zap, color: '#34d399', title: '2단계 AI 파이프라인 — 할루시네이션 최소화',
            desc: '1차 관찰(사실 확인)과 2차 채점(근거 기반)을 분리하여 Gemini 2.5가 추측을 배제하고 정확하게 평가합니다.'
        },
        {
            icon: Shield, color: '#fbbf24', title: '건축설계 논문 특화 보정 알고리즘',
            desc: '방증성은 건축설계 장르에서 구조적으로 증명하기 어렵습니다. 장르 특성을 반영한 보정으로 부당한 감점을 방지합니다.'
        },
        {
            icon: MessageSquare, color: '#f472b6', title: 'RAG 기반 AI 논문 컨설팅 채팅',
            desc: '평가 완료 후 RAG 맥락을 유지한 채 논문의 약점·보완 방법을 AI와 무제한으로 대화할 수 있습니다.'
        },
        {
            icon: TrendingUp, color: '#fb923c', title: '정량적 등급 판정 + 방향성 제시',
            desc: 'S·A·B·C·D 5등급과 조건부통과/수정재심/대폭수정재심을 즉시 판정하고 핵심 개선사항을 항목별로 제시합니다.'
        },
    ];

    return (
        <>
            <style>{`
            @keyframes shimmer-lr {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .hero-shimmer {
                background: linear-gradient(
                    90deg,
                    #c084fc 0%,
                    #818cf8 18%,
                    #38bef0 35%,
                    #a78bfa 50%,
                    #f472b6 68%,
                    #38bef0 82%,
                    #c084fc 100%
                );
                background-size: 300% 100%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: shimmer-lr 3.5s ease-in-out infinite;
            }
            /* ─── Neon Flicker (형광 깜빡임) ─── */
            @keyframes neon-flicker {
                0%, 18%, 22%, 25%, 53%, 57%, 100% {
                    opacity: 1;
                    text-shadow:
                        0 0 4px #39ff14,
                        0 0 10px #39ff14,
                        0 0 20px #39ff14,
                        0 0 40px #00ff88;
                    box-shadow:
                        0 0 6px rgba(57,255,20,0.50),
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
                0%, 100% { opacity: 1; transform: scale(1);   box-shadow: 0 0 0 0 rgba(57,255,20,0.6); }
                50%       { opacity: 0.7; transform: scale(1.3); box-shadow: 0 0 0 5px rgba(57,255,20,0); }
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

            {/* ── Password Modal ───────────────────────────────── */}
            {showModal && (
                <motion.div
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setPw(''); setPwError(false); } }}
                >
                    <motion.div
                        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(14,14,26,0.95)',
                            border: '1px solid rgba(167,139,250,0.25)',
                            boxShadow: '0 0 60px rgba(124,58,237,0.25)',
                        }}
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Top accent bar */}
                        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#3b82f6,#7c3aed)' }} />

                        <div className="p-8">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.30)' }}>
                                    <Lock className="w-6 h-6" style={{ color: '#a78bfa' }} />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-center font-black text-xl mb-1" style={{ color: 'rgba(255,255,255,0.90)' }}>
                                접근 코드 확인
                            </h3>
                            <p className="text-center text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                논문 평가 시스템은 접근 코드가 필요합니다.
                            </p>

                            {/* Input + shake on error */}
                            <motion.div
                                animate={shaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="relative mb-3">
                                    <input
                                        type="password"
                                        placeholder="접근 코드 입력"
                                        value={pw}
                                        onChange={e => { setPw(e.target.value); setPwError(false); }}
                                        onKeyDown={e => e.key === 'Enter' && handlePwSubmit()}
                                        autoFocus
                                        className="w-full px-5 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.055)',
                                            border: pwError
                                                ? '1.5px solid rgba(248,113,113,0.70)'
                                                : '1.5px solid rgba(255,255,255,0.10)',
                                            color: 'rgba(255,255,255,0.88)',
                                            letterSpacing: pw ? '0.25em' : '0',
                                        }}
                                    />
                                </div>
                                {pwError && (
                                    <p className="text-center text-xs mb-3" style={{ color: '#f87171' }}>
                                        올바른 접근 코드가 아닙니다.
                                    </p>
                                )}
                            </motion.div>

                            {/* Buttons */}
                            <motion.button
                                onClick={handlePwSubmit}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                className="w-full py-3.5 rounded-xl font-bold text-sm text-white mb-3"
                                style={{
                                    background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                                    boxShadow: '0 0 20px rgba(124,58,237,0.35)',
                                }}
                            >
                                입장하기 <ArrowRight className="inline w-4 h-4 ml-1" />
                            </motion.button>
                            <button
                                onClick={() => { setShowModal(false); setPw(''); setPwError(false); }}
                                className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                                style={{ color: 'rgba(255,255,255,0.30)', background: 'transparent' }}
                            >
                                취소
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            <motion.div
                className="relative min-h-screen"
                style={{ background: '#08080f', color: 'rgba(255,255,255,0.82)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
            >
                {/* ── Grid BG ─────────────────────────────────────────── */}
                <div className="fixed inset-0 pointer-events-none" style={{
                    backgroundImage: `
          linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)`,
                    backgroundSize: '72px 72px',
                    zIndex: 0,
                }} />
                <div className="fixed inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse 70% 50% at 50% 0%, transparent 30%, #08080f 75%)',
                    zIndex: 0,
                }} />
                <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
                    width: 800, height: 450, zIndex: 0,
                    background: 'radial-gradient(ellipse, rgba(120,40,255,0.13) 0%, transparent 65%)',
                    filter: 'blur(24px)',
                }} />

                {/* ── Floating Academic Shapes ─────────────────────────── */}
                <FloatingShapes />

                {/* ── NAV ─────────────────────────────────────────────── */}
                <nav
                    className="fixed top-0 left-0 right-0 z-50"
                    style={{
                        background: 'rgba(8,8,15,0.80)',
                        backdropFilter: 'blur(18px)',
                        borderBottom: '1px solid rgba(255,255,255,0.055)',
                    }}
                >
                    <div className="max-w-6xl mx-auto px-6 h-14 grid grid-cols-3 items-center">
                        {/* Left: company link */}
                        <div className="flex items-center">
                            <a
                                href="https://www.ninetynine99.co.kr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold transition-all"
                                style={{ color: 'rgba(255,255,255,0.38)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
                            >
                                <ExternalLink className="w-3 h-3" />
                                Ninetynine Inc.
                            </a>
                        </div>

                        {/* Center: logo + title */}
                        <div className="flex items-center justify-center gap-2.5">
                            <GraduationCap
                                className="flex-shrink-0"
                                style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.90)', filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.50))' }}
                            />
                            <span className="font-bold text-sm tracking-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
                                Academic Advisor in Architecture
                            </span>
                            <span
                                className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                    background: 'rgba(167,139,250,0.12)',
                                    color: '#a78bfa',
                                    border: '1px solid rgba(167,139,250,0.22)',
                                }}
                            >
                                BETA
                            </span>
                        </div>

                        {/* Right: RAG AI Connected badge */}
                        <div className="flex items-center justify-end">
                            <div
                                className="rag-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-md"
                                style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em' }}
                            >
                                <span
                                    className="rag-dot flex-shrink-0"
                                    style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }}
                                />
                                RAG AI CONNECTED
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ═══ HERO ════════════════════════════════════════════ */}
                <section
                    className="relative flex items-center justify-center text-center px-6"
                    style={{ minHeight: '100vh', paddingTop: '56px', zIndex: 1 }}
                >
                    <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none -translate-y-1/2" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.18), rgba(59,130,246,0.18), transparent)',
                    }} />

                    <div className="max-w-4xl relative z-10">
                        {/* Eyebrow */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="flex justify-center mb-8"
                        >
                            <div className="flex items-center gap-3 px-4 py-2 rounded-md"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    건축학 논문 2-Stage AI 심사 시스템
                                </span>
                                <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                            </div>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.38, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            className="font-black leading-[1.08] tracking-tight mb-7"
                            style={{ fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)' }}
                        >
                            <span style={{
                                background: 'linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.50) 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                            }}>직관에서 근거로</span>
                            <br />
                            <span className="hero-shimmer">건축학논문 자동 심사 시스템</span>
                        </motion.h1>

                        {/* Sub */}
                        <motion.p
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.7 }}
                            className="max-w-3xl mx-auto text-base leading-loose mb-12"
                            style={{ color: 'rgba(255,255,255,0.42)' }}
                        >
                            <span className="font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>89편</span> 최우수 논문 벤치마크 벡터 DB와 <span className="font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>50개 항목 2단계 AI 파이프라인</span>으로,<br />
                            실제 심사위원보다 더 꼼꼼하게, 단 <span className="font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>60초</span> 만에 평가합니다.
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center"
                        >
                            <motion.button
                                onClick={() => setShowModal(true)}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-md font-bold text-base text-white"
                                style={{
                                    background: 'linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%)',
                                    boxShadow: '0 0 28px rgba(124,58,237,0.40), 0 0 56px rgba(124,58,237,0.14)',
                                }}
                            >
                                <FileText className="w-4 h-4" />
                                논문 평가 시작하기
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                            <motion.a
                                href="#pipeline"
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center justify-center gap-2 px-6 py-4 rounded-md font-semibold text-sm"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.09)',
                                    color: 'rgba(255,255,255,0.52)',
                                    cursor: 'pointer',
                                }}
                            >
                                평가 파이프라인 보기 <ChevronRight className="w-3.5 h-3.5" />
                            </motion.a>
                        </motion.div>
                    </div>
                </section>

                {/* ═══ STATS ═══════════════════════════════════════════ */}
                <section
                    className="relative py-14 px-6"
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        zIndex: 1,
                    }}
                >
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
                        {[
                            { val: 50, suf: '개', label: '평가 기준 항목', color: '#a78bfa' },
                            { val: 89, suf: '편', label: '비교 기준 논문 DB', color: '#60a5fa' },
                            { val: 4, suf: '개', label: '평가 영역', color: '#34d399' },
                            { val: 60, suf: '초', label: '평균 분석 완료', color: '#fbbf24' },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.09 }}
                            >
                                <div className="text-[2.6rem] font-black tabular-nums mb-1" style={{ color: s.color }}>
                                    <Num to={s.val} suffix={s.suf} />
                                </div>
                                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ═══ PIPELINE ════════════════════════════════════════ */}
                <section id="pipeline" className="relative py-24 px-6" style={{ zIndex: 1 }}>
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12"
                        >
                            <SLabel text="2-Stage AI Pipeline" color="#a78bfa" />
                            <h2 className="text-4xl font-black leading-tight mb-4"
                                style={{
                                    background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.45) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                추측 없이, 관찰에서<br />채점까지
                            </h2>
                            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                단순 텍스트 분류가 아닙니다. 실제 동료 심사 방법론을 2단계로 AI로 재현하여
                                할루시네이션을 최소화하고 근거 기반 평가를 실현합니다.
                            </p>
                        </motion.div>

                        {/* Pipeline grid: 3 + 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {stages.slice(0, 3).map((s, i) => (
                                <PipeStage key={i} {...s} delay={i * 0.08} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:max-w-[66.6%]">
                            {stages.slice(3).map((s, i) => (
                                <PipeStage key={i} {...s} delay={(i + 3) * 0.08} />
                            ))}
                        </div>

                        {/* Phase callout */}
                        <div className="mt-10 grid md:grid-cols-2 gap-4">
                            {[
                                {
                                    label: 'Phase 1 — Observation', color: '#34d399',
                                    items: ['사실 확인 방식으로만 관찰', '가치 판단·점수 부여 금지', '50개 항목 전부 체크', '근거 문장 직접 인용'],
                                },
                                {
                                    label: 'Phase 2 — Scoring', color: '#a78bfa',
                                    items: ['관찰 결과만을 근거로 채점', '추측·새 판단 추가 금지', '건축설계 장르 보정 적용', '100점 환산 + 등급 판정'],
                                },
                            ].map((ph, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="rounded-lg p-6"
                                    style={{ background: `${ph.color}07`, border: `1px solid ${ph.color}22` }}
                                >
                                    <div className="text-[0.65rem] font-bold tracking-widest uppercase mb-4" style={{ color: ph.color }}>
                                        {ph.label}
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2.5">
                                        {ph.items.map((it, j) => (
                                            <div key={j} className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: ph.color }} />
                                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{it}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ OUTPUT PREVIEW ══════════════════════════════════ */}
                <section
                    className="relative py-24 px-6"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 1 }}
                >
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">

                        {/* Left copy */}
                        <motion.div
                            initial={{ opacity: 0, x: -28 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <SLabel text="Output Preview" color="#60a5fa" />
                            <h2 className="text-4xl font-black leading-tight mb-6"
                                style={{
                                    background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.45) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                숫자로 증명하는<br />객관적 평가
                            </h2>
                            <p className="text-base leading-loose mb-8" style={{ color: 'rgba(255,255,255,0.40)' }}>
                                4개 영역 환산 점수와 S~D 등급 판정이 즉시 산출됩니다.<br />
                                &ldquo;왜 이 점수인가&rdquo;를 근거 문장으로<br />
                                직접 확인할 수 있습니다.
                            </p>
                            <div className="space-y-2.5">
                                {[
                                    '총평 3~5문장 종합 평가',
                                    '영역별 세부 평가 (구체적 근거)',
                                    '핵심 개선 사항 항목별 제시',
                                    '논증 강화 전략 제안',
                                    'RAG 비교 논문 유사도 리스트',
                                ].map((t, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Score card mock */}
                        <motion.div
                            initial={{ opacity: 0, x: 28 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="relative rounded-xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                {/* Scan line */}
                                <motion.div
                                    className="absolute left-0 right-0 h-px pointer-events-none"
                                    style={{ background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.55),transparent)' }}
                                    animate={{ top: ['4%', '96%', '4%'] }}
                                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                {/* mac dots header */}
                                <div className="flex items-center justify-between px-5 py-3.5"
                                    style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
                                    <div className="flex gap-1.5">
                                        {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                                            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                                        ))}
                                    </div>
                                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>
                                        논문 평가 종합평
                                    </span>
                                    <div />
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Total */}
                                    <div className="flex items-end gap-3">
                                        <div>
                                            <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>종합 점수</div>
                                            <div className="text-5xl font-black tabular-nums" style={{ color: '#a78bfa' }}>78</div>
                                        </div>
                                        <div className="pb-1.5">
                                            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.28)' }}>/100</span>
                                        </div>
                                        <div className="ml-auto pb-1">
                                            <div className="px-3 py-1.5 rounded-md text-xs font-bold"
                                                style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.26)', color: '#fbbf24' }}>
                                                B등급 — 수정 후 재심
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bars */}
                                    <div className="space-y-3.5">
                                        <ScoreBar label="A. 논리성 및 담론" val={24} max={30} color="#a78bfa" />
                                        <ScoreBar label="B. 체계성 및 방법론" val={22} max={30} color="#60a5fa" />
                                        <ScoreBar label="C. 독창성 및 기여" val={17} max={20} color="#34d399" />
                                        <ScoreBar label="D. 반증성 및 한계" val={15} max={20} color="#fbbf24" />
                                    </div>

                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                                    {/* Improvements */}
                                    <div>
                                        <div className="text-[0.62rem] font-bold tracking-widest uppercase mb-3"
                                            style={{ color: 'rgba(255,255,255,0.28)' }}>핵심 개선 사항</div>
                                        {[
                                            { text: '이론적 틀(Theoretical Framework) 명시 필요', c: '#a78bfa' },
                                            { text: '반론·대안적 해석 검토 추가 권장', c: '#fbbf24' },
                                            { text: '참고문헌 인용 양식 통일 필요', c: '#60a5fa' },
                                        ].map((it, i) => (
                                            <div key={i} className="flex items-start gap-2 mb-2">
                                                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: it.c }} />
                                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.48)' }}>{it.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                                        <div className="text-[0.62rem] font-bold tracking-widest uppercase mb-3"
                                            style={{ color: 'rgba(255,255,255,0.28)' }}>RAG 유사 논문 TOP 3</div>
                                        {[
                                            { title: 'Parametric Design Methodology...', sim: '94%', color: '#34d399' },
                                            { title: 'Critical Regionalism in Contemporary...', sim: '88%', color: '#60a5fa' },
                                            { title: 'Spatial Configuration Analysis...', sim: '81%', color: '#a78bfa' },
                                        ].map((p, i) => (
                                            <div key={i} className="flex items-center justify-between mb-2">
                                                <span className="text-xs truncate max-w-[72%]" style={{ color: 'rgba(255,255,255,0.40)' }}>{p.title}</span>
                                                <span className="text-xs font-bold tabular-nums" style={{ color: p.color }}>{p.sim}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══ CORE CAPABILITIES ════════════════════════════════ */}
                <section
                    className="relative py-24 px-6"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 1 }}
                >
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-14"
                        >
                            <SLabel text="6 Core Capabilities" color="#34d399" />
                            <h2 className="text-4xl font-black leading-tight"
                                style={{
                                    background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.45) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                기존 방식으로는<br />불가능한 6가지
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-x-20">
                            <div>
                                {caps.slice(0, 3).map((c, i) => (
                                    <CapRow key={i} {...c} delay={i * 0.07} />
                                ))}
                            </div>
                            <div>
                                {caps.slice(3).map((c, i) => (
                                    <CapRow key={i} {...c} delay={(i + 3) * 0.07} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ COMPARISON ═══════════════════════════════════════ */}
                <section
                    className="relative py-24 px-6"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 1 }}
                >
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-14"
                        >
                            <SLabel text="기존 방식 vs AI 시스템" color="#f472b6" />
                            <h2 className="text-4xl font-black"
                                style={{
                                    background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.45) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                무엇이 다른가
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-xl p-8"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <div className="text-xs font-bold tracking-widest uppercase mb-6"
                                    style={{ color: 'rgba(255,255,255,0.28)' }}>기존 방식 — 셀프 점검</div>
                                {[
                                    '심사위원 기준을 몰라 막연하게 수정',
                                    '동료에게 부탁해도 주관적 피드백',
                                    '논문 DB와 비교 불가 — 상대적 수준 파악 불가',
                                    '어떤 항목이 부족한지 체계적 파악 어려움',
                                    '보완 방향 확인에 수일~수주 소요',
                                ].map((r, i) => (
                                    <div key={i} className="flex items-start gap-3 mb-3.5">
                                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.20)' }} />
                                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{r}</span>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-xl p-8 relative overflow-hidden"
                                style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.22)' }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-0.5"
                                    style={{ background: 'linear-gradient(90deg,#7c3aed,#3b82f6)' }} />
                                <div className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: '#a78bfa' }}>
                                    Thesis Advisor AI
                                </div>
                                {[
                                    '50개 항목 국제 동료심사 기준 자동 점검',
                                    '89편 최우수 논문 DB와 정량적 비교',
                                    '2단계 파이프라인으로 할루시네이션 최소화',
                                    '영역별 점수 + 구체적 근거 문장 제공',
                                    '60초 완료 → AI 채팅으로 즉시 후속 상담',
                                ].map((t, i) => (
                                    <div key={i} className="flex items-start gap-3 mb-3.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{t}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ═══ FINAL CTA ════════════════════════════════════════ */}
                <section
                    className="relative py-32 px-6 text-center"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 1 }}
                >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div style={{
                            width: 650, height: 380,
                            background: 'radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 65%)',
                            filter: 'blur(32px)',
                        }} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="inline-block mb-7 px-4 py-2 rounded-md"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                PDF 업로드 → 60초 → 종합 보고서
                            </span>
                        </div>

                        <h2 className="font-black leading-[1.06] tracking-tight mb-6"
                            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)' }}>
                            <span style={{
                                background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.48) 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                            }}>
                                지금, 내 논문의 실력을<br />
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg,#c084fc 0%,#60a5fa 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>
                                AI가 증명합니다.
                            </span>
                        </h2>

                        <p className="text-base mb-10 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.32)' }}>
                            별도 회원가입 없이 PDF 하나로 즉시 시작하세요.
                        </p>

                        <motion.button
                            onClick={() => setShowModal(true)}
                            whileHover={{ scale: 1.04, boxShadow: '0 0 54px rgba(124,58,237,0.55), 0 0 100px rgba(124,58,237,0.18)' }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-md font-bold text-lg text-white"
                            style={{
                                background: 'linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%)',
                                boxShadow: '0 0 36px rgba(124,58,237,0.42), 0 0 72px rgba(124,58,237,0.14)',
                            }}
                        >
                            <FileText className="w-5 h-5" />
                            무료로 논문 평가 받기
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                </section>

                {/* ═══ FOOTER ═══════════════════════════════════════════ */}
                <footer
                    className="relative py-8 px-6"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 1 }}
                >
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Left */}
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                            <a
                                href="https://www.ninetynine99.co.kr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold transition-colors"
                                style={{ color: 'rgba(255,255,255,0.50)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.82)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
                            >
                                ㈜나인티나인
                            </a>
                            {' '}|{' '}
                            <a href="mailto:bignine99@gmail.com"
                                style={{ color: 'rgba(255,255,255,0.30)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
                            >
                                bignine99@gmail.com
                            </a>
                        </div>
                        {/* Right */}
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
                            © 2026 All rights reserved by Ninetynine Inc.
                        </div>
                    </div>
                </footer>

            </motion.div>
        </>
    );
}
