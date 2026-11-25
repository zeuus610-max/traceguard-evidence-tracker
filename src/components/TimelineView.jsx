import { TIMELINE_MILESTONES, SYSTEM_COLORS } from '../data/constants'
import { getSeverityColor } from '../utils/helpers'
import { Calendar, ChevronRight } from 'lucide-react'

export default function TimelineView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <Calendar className="w-7 h-7 text-cyan-400" /> Investigation Timeline
      </h2>
      <p className="text-sm text-slate-400">
        Chronological reconstruction of key events in Case CR-26-047 — Harbor & Finch Freight Pvt. Ltd.
      </p>

      {/* System legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(SYSTEM_COLORS).map(([sys, color]) => (
          <div key={sys} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-400">{sys}</span>
          </div>
        ))}
      </div>

      {/* Vertical timeline */}
      <div className="relative ml-6">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-slate-700 to-red-500/50" />

        <div className="space-y-1">
          {TIMELINE_MILESTONES.map((m, i) => {
            const sysColor = SYSTEM_COLORS[m.system] || '#64748b'
            const sevColor = getSeverityColor(m.severity)
            const year = m.date.split('-')[0]
            const monthDay = new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

            return (
              <div key={i} className="relative flex items-start gap-6 py-4 group">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110"
                    style={{
                      borderColor: sysColor,
                      backgroundColor: `${sysColor}20`,
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sysColor }} />
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 glass-card rounded-xl p-4 hover:bg-white/5 transition-all group-hover:border-opacity-30"
                  style={{ borderColor: `${sysColor}30` }}>
                  <div className="flex items-center gap-3 mb-2">
                    {/* Date */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-slate-500 font-mono">{year}</p>
                      <p className="text-sm font-bold text-slate-200">{monthDay}</p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600" />

                    {/* Severity badge */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                      style={{ backgroundColor: `${sevColor}20`, color: sevColor }}>
                      {m.severity}
                    </span>

                    {/* System badge */}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${sysColor}15`, color: sysColor, border: `1px solid ${sysColor}30` }}>
                      {m.system}
                    </span>
                  </div>

                  {/* Event description */}
                  <p className="text-sm text-slate-200 font-medium">{m.event}</p>

                  {/* Evidence links */}
                  {m.evidence.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {m.evidence.map(e => (
                        <span key={e} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Investigation phases */}
      <div className="glass-card rounded-xl p-6 mt-8">
        <h3 className="text-lg font-bold text-white mb-4">NIST Incident Response Phases</h3>
        <div className="grid grid-cols-6 gap-2">
          {['Preparation', 'Detection', 'Containment', 'Eradication', 'Recovery', 'Lessons Learned'].map((phase, i) => (
            <div key={phase} className={`text-center p-3 rounded-lg border ${i <= 1 ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-slate-700 bg-navy-800'}`}>
              <p className="text-xs font-medium text-slate-300">{phase}</p>
              <p className="text-[10px] text-slate-500 mt-1">{i <= 1 ? 'Active' : 'Pending'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
