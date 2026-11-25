import React from 'react'
import { Shield, Database, AlertTriangle, FileStack } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Header() {
  const evidenceFiles = useStore((s) => s.evidenceFiles)
  const anomalies = useStore((s) => s.anomalies)
  const timelineEvents = useStore((s) => s.timelineEvents)

  const fileCount = Object.keys(evidenceFiles).length
  const totalEvents = Object.values(evidenceFiles).reduce(
    (sum, f) => sum + (f.rowCount || 0),
    0
  )
  const anomalyCount = anomalies.length

  return (
    <header className="flex flex-col gap-3 px-6 py-4 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 animate-pulse-glow">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold tracking-widest text-white font-sans">
              TRACEGUARD
            </span>
          </div>

          {/* Badges */}
          <span className="px-3 py-1 text-xs font-semibold tracking-wider rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            CRIMEATHON'26 • CR-26-047
          </span>
          <span className="px-3 py-1 text-xs font-semibold tracking-wider rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
            DEFENSE TRACK
          </span>
        </div>

        <span className="text-sm text-slate-400 font-mono">
          Harbor &amp; Finch Freight Pvt. Ltd.
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6">
        <Stat
          icon={<FileStack className="w-4 h-4 text-cyan-400" />}
          label="Evidence Files"
          value={fileCount}
        />
        <Stat
          icon={<Database className="w-4 h-4 text-green-400" />}
          label="Total Events"
          value={totalEvents.toLocaleString()}
        />
        <Stat
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          label="Anomalies"
          value={anomalyCount}
          highlight={anomalyCount > 0}
        />
      </div>
    </header>
  )
}

function Stat({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-slate-500">{label}:</span>
      <span
        className={`font-mono font-semibold ${
          highlight ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
