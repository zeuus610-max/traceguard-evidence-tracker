import React, { useMemo } from 'react';
import {
  Database,
  Shield,
  FileSearch,
  AlertTriangle,
  Clock,
  GitMerge,
  KeyRound,
  Activity,
} from 'lucide-react';
import { useStore } from '../store/useStore.js';
import {
  SYSTEM_COLORS,
  TIMELINE_MILESTONES,
  EVIDENCE_CATALOG,
} from '../data/constants.js';

/* ─── severity helpers ─── */
const SEVERITY_STYLES = {
  critical: { bg: 'rgba(239,68,68,0.25)', border: '#ef4444', text: '#fca5a5' },
  high:     { bg: 'rgba(249,115,22,0.25)', border: '#f97316', text: '#fdba74' },
  warning:  { bg: 'rgba(245,158,11,0.25)', border: '#f59e0b', text: '#fcd34d' },
  info:     { bg: 'rgba(56,189,248,0.25)',  border: '#38bdf8', text: '#7dd3fc' },
};

const sevStyle = (sev) => SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;

/* ─── 1. Metric Cards ─── */
function MetricCards() {
  const evidenceFiles = useStore((s) => s.evidenceFiles);
  const anomalies = useStore((s) => s.anomalies);

  const fileCount = Object.keys(evidenceFiles).length;

  const totalEvents = useMemo(
    () =>
      Object.values(evidenceFiles).reduce(
        (sum, f) => sum + (f.rowCount || (f.data ? f.data.length : 0)),
        0,
      ),
    [evidenceFiles],
  );

  const anomalyCount = anomalies.length;

  const highRisk = useMemo(
    () =>
      anomalies.filter(
        (a) => a.severity === 'critical' || a.severity === 'high',
      ).length,
    [anomalies],
  );

  const cards = [
    { icon: Database, value: fileCount, label: 'Evidence Files Uploaded', accent: '#38bdf8' },
    { icon: Activity, value: totalEvents, label: 'Total Events Loaded', accent: '#22c55e' },
    { icon: FileSearch, value: anomalyCount, label: 'Anomalies Detected', accent: '#f59e0b' },
    { icon: AlertTriangle, value: highRisk, label: 'High-Risk Alerts', accent: '#ef4444' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {cards.map((c) => (
        <div key={c.label} className="glass-card animate-fade-in" style={{ padding: 20, textAlign: 'center' }}>
          <c.icon size={28} color={c.accent} style={{ marginBottom: 8 }} />
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: c.accent,
            }}
          >
            {c.value}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 2. System Architecture Diagram (SVG) ─── */
function SystemArchDiagram() {
  /*
      Layout positions (cx, cy):
        SSO (120, 60)   ────   LedgerOne (380, 60)
                                     │
                              TallyBridge (380, 180)
                                     │
                              HelpDeskr (380, 300)

        BlueVault (120, 300)  ─── connected via access keys ───  TallyBridge
  */
  const nodes = [
    { id: 'SSO',         label: 'SSO',               sub: 'Staff Login',  cx: 120, cy: 60 },
    { id: 'LedgerOne',   label: 'LedgerOne',         sub: 'Finance',      cx: 380, cy: 60 },
    { id: 'TallyBridge', label: 'TallyBridge',       sub: 'Connect',      cx: 380, cy: 180 },
    { id: 'HelpDeskr',   label: 'HelpDeskr',         sub: 'Support',      cx: 380, cy: 300 },
    { id: 'BlueVault',   label: 'BlueVault',         sub: 'Storage',      cx: 120, cy: 300 },
  ];

  const edges = [
    { from: 'SSO', to: 'LedgerOne', label: 'SSO Auth' },
    { from: 'LedgerOne', to: 'TallyBridge', label: 'API Keys' },
    { from: 'TallyBridge', to: 'HelpDeskr', label: 'Overnight Sync' },
    { from: 'BlueVault', to: 'TallyBridge', label: 'Access Keys' },
    { from: 'BlueVault', to: 'HelpDeskr', label: 'File Fetch' },
  ];

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
        <Shield size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
        System Architecture — Harbor &amp; Finch
      </h3>
      <svg viewBox="0 0 500 370" style={{ width: '100%', height: 'auto' }}>
        {/* edges */}
        {edges.map((e) => {
          const a = nodeMap[e.from];
          const b = nodeMap[e.to];
          const mx = (a.cx + b.cx) / 2;
          const my = (a.cy + b.cy) / 2;
          return (
            <g key={e.from + e.to}>
              <line
                x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
                stroke="#334155" strokeWidth={2} strokeDasharray="6 4"
              />
              <rect
                x={mx - 42} y={my - 10} width={84} height={20} rx={4}
                fill="#1e293b" stroke="#334155" strokeWidth={1}
              />
              <text x={mx} y={my + 4} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="'Inter', sans-serif">
                {e.label}
              </text>
            </g>
          );
        })}

        {/* nodes */}
        {nodes.map((n) => {
          const color = SYSTEM_COLORS[n.id] || '#94a3b8';
          return (
            <g key={n.id}>
              <rect
                x={n.cx - 54} y={n.cy - 28} width={108} height={56} rx={10}
                fill="rgba(15,23,42,0.85)" stroke={color} strokeWidth={2}
              />
              <text
                x={n.cx} y={n.cy - 4} textAnchor="middle" fill={color}
                fontSize={13} fontWeight="700" fontFamily="'JetBrains Mono', monospace"
              >
                {n.label}
              </text>
              <text
                x={n.cx} y={n.cy + 14} textAnchor="middle" fill="#94a3b8"
                fontSize={10} fontFamily="'Inter', sans-serif"
              >
                {n.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── 3. Innovation Pillars ─── */
function InnovationPillars() {
  const pillars = [
    {
      icon: GitMerge,
      title: 'Twin-Proof Corroboration',
      desc: 'Every high-risk action must have a matching record in another system',
      accent: '#38bdf8',
    },
    {
      icon: Clock,
      title: 'Drift-Aware Clock Normalization',
      desc: 'Automatically corrects timezone differences and clock skew',
      accent: '#22c55e',
    },
    {
      icon: KeyRound,
      title: 'Legacy-Key Canary Trap',
      desc: 'Routes unowned credential traffic to monitored quarantine',
      accent: '#f59e0b',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {pillars.map((p) => (
        <div
          key={p.title}
          className="glass-card animate-fade-in"
          style={{ padding: 24, borderTop: `3px solid ${p.accent}` }}
        >
          <p.icon size={26} color={p.accent} style={{ marginBottom: 10 }} />
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
            {p.title}
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: '#94a3b8' }}>
            {p.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── 4. Recent Alerts Feed ─── */
function RecentAlerts() {
  const anomalies = useStore((s) => s.anomalies);
  const latest = anomalies.slice(-10).reverse();

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24, flex: 1, minWidth: 0 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
        <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
        Recent Alerts
      </h3>

      {latest.length === 0 ? (
        <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 32 }}>
          No anomalies detected yet — upload evidence to begin analysis.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
          {latest.map((a, i) => {
            const s = sevStyle(a.severity);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: s.bg,
                  borderLeft: `3px solid ${s.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: s.border,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {a.severity || 'info'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#e2e8f0', marginBottom: 2 }}>
                    {a.description || a.message || 'Anomaly detected'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    {a.timestamp || '—'}
                    {a.evidenceIds && a.evidenceIds.length > 0 && (
                      <span style={{ marginLeft: 8 }}>
                        [{a.evidenceIds.join(', ')}]
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── 5. Investigation Timeline Preview ─── */
function TimelinePreview() {
  const milestones = TIMELINE_MILESTONES;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
        <Clock size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
        Investigation Timeline
      </h3>

      <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 8 }}>
        {/* horizontal track */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0,
            minWidth: milestones.length * 130,
            position: 'relative',
          }}
        >
          {/* baseline */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              left: 24,
              right: 24,
              height: 2,
              background: '#334155',
            }}
          />

          {milestones.map((m, i) => {
            const color = SYSTEM_COLORS[m.system] || '#94a3b8';
            const s = sevStyle(m.severity);
            return (
              <div
                key={i}
                style={{
                  flex: '1 0 120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* dot */}
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: color,
                    border: `2px solid ${s.border || color}`,
                    marginTop: 22,
                    boxShadow: `0 0 8px ${color}55`,
                    flexShrink: 0,
                  }}
                />
                {/* date */}
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#94a3b8',
                    marginTop: 8,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.date}
                </div>
                {/* event label */}
                <div
                  style={{
                    fontSize: 10.5,
                    color: '#cbd5e1',
                    textAlign: 'center',
                    marginTop: 4,
                    lineHeight: 1.4,
                    maxWidth: 110,
                  }}
                >
                  {m.event}
                </div>
                {/* system badge */}
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 4,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: `${color}22`,
                    color,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {m.system}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
export default function Dashboard() {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Section title */}
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
          Dashboard — Case CR-26-047
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Harbor &amp; Finch Freight Pvt. Ltd. • Investigation Overview
        </p>
      </div>

      {/* 1 — Metrics */}
      <MetricCards />

      {/* 2 — Architecture */}
      <SystemArchDiagram />

      {/* 3 — Innovation pillars */}
      <InnovationPillars />

      {/* 4 + 5 — Alerts & Timeline side by side on wide, stacked on narrow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <RecentAlerts />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TimelinePreview />
        </div>
      </div>
    </div>
  );
}
