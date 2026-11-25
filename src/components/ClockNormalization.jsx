import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { EVIDENCE_CATALOG } from '../data/constants'
import { normalizeTimestamp, findTimestampColumns, formatDate } from '../utils/helpers'
import { Clock, ArrowRight, Check, AlertTriangle, RefreshCw } from 'lucide-react'

const TZ_INFO = {
  'UTC': { label: 'UTC', color: 'green', action: 'No conversion needed' },
  'UTC+5:30': { label: 'UTC+5:30 (India)', color: 'amber', action: 'Subtract 5h 30m' },
  'Epoch+drift': { label: 'Unix epoch + clock drift', color: 'red', action: 'Drift correction required' },
  'N/A': { label: 'Point-in-time', color: 'slate', action: 'No timestamps' },
  '-': { label: 'Document', color: 'slate', action: 'No timestamps' },
}

export default function ClockNormalization() {
  const { evidenceFiles, normalizedData, setNormalizedData, driftOffset, setDriftOffset } = useStore()

  const uploadedEvidence = useMemo(() =>
    EVIDENCE_CATALOG.filter(e => evidenceFiles[e.id]),
  [evidenceFiles])

  const handleNormalizeAll = () => {
    uploadedEvidence.forEach(ev => {
      const fileData = evidenceFiles[ev.id]
      if (!fileData?.data?.length) return
      const tsCols = findTimestampColumns(fileData.columns)
      if (!tsCols.length) return

      const normalized = fileData.data.map(row => {
        const newRow = { ...row }
        tsCols.forEach(col => {
          const rawVal = row[col]
          if (rawVal != null) {
            const norm = normalizeTimestamp(rawVal, ev.tz, driftOffset)
            newRow[`${col}_normalized_utc`] = norm ? norm.toISOString() : null
          }
        })
        return newRow
      })
      setNormalizedData(ev.id, normalized)
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Clock className="w-7 h-7 text-cyan-400" /> Clock Normalization
        </h2>
        <button onClick={handleNormalizeAll}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors font-medium text-sm">
          <RefreshCw className="w-4 h-4" /> Normalize All Timestamps
        </button>
      </div>

      <p className="text-slate-400 text-sm">
        Evidence logs use different time standards. All must be converted to UTC before cross-system correlation.
      </p>

      {/* Timezone source table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-700/50 text-slate-400">
              <th className="text-left p-3">Evidence</th>
              <th className="text-left p-3">Source Timezone</th>
              <th className="text-left p-3">Conversion Action</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {EVIDENCE_CATALOG.filter(e => ['UTC', 'UTC+5:30', 'Epoch+drift'].includes(e.tz)).map(ev => {
              const info = TZ_INFO[ev.tz]
              const uploaded = !!evidenceFiles[ev.id]
              const normalized = !!normalizedData[ev.id]
              return (
                <tr key={ev.id} className="border-t border-slate-800 hover:bg-white/5">
                  <td className="p-3">
                    <span className="font-mono font-bold text-slate-300">{ev.id}</span>
                    <span className="text-slate-500 ml-2 text-xs">{ev.name}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${info.color === 'green' ? 'bg-green-500/20 text-green-400' :
                        info.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'}`}>
                      {info.label}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">{info.action}</td>
                  <td className="p-3">
                    {!uploaded ? (
                      <span className="text-slate-600 text-xs">Not uploaded</span>
                    ) : normalized ? (
                      <span className="text-green-400 text-xs flex items-center gap-1"><Check className="w-3 h-3" /> Normalized</span>
                    ) : (
                      <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pending</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* E05 Drift adjustment */}
      <div className="glass-card rounded-xl p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5" /> E05 — BlueVault Clock Drift Correction
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          BlueVault uses an unsynchronized Unix epoch clock that runs <span className="text-red-400 font-bold">fast</span>.
          Adjust the drift offset below to correct timestamps.
        </p>
        <div className="flex items-center gap-6">
          <input type="range" min={-300} max={300} step={1} value={driftOffset}
            onChange={(e) => setDriftOffset(Number(e.target.value))}
            className="flex-1 accent-red-400" />
          <div className="text-center min-w-[120px]">
            <span className="text-2xl font-mono font-bold text-red-400">{driftOffset > 0 ? '+' : ''}{driftOffset}s</span>
            <p className="text-xs text-slate-500 mt-1">drift offset</p>
          </div>
        </div>
      </div>

      {/* Before/After comparison */}
      {uploadedEvidence.filter(ev => ['UTC+5:30', 'Epoch+drift'].includes(ev.tz)).map(ev => {
        const fileData = evidenceFiles[ev.id]
        const tsCols = findTimestampColumns(fileData.columns)
        if (!tsCols.length) return null

        return (
          <div key={ev.id} className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-bold text-cyan-400 font-mono mb-3">
              {ev.id} — Before / After ({ev.tz} → UTC)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left p-2">#</th>
                    {tsCols.map(c => (
                      <th key={c} className="text-left p-2" colSpan={2}>
                        {c}
                        <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                          <span>Raw</span>
                          <span className="text-green-400">→ Normalized UTC</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileData.data.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-white/5">
                      <td className="p-2 text-slate-500">{i + 1}</td>
                      {tsCols.map(c => {
                        const raw = row[c]
                        const norm = normalizeTimestamp(raw, ev.tz, driftOffset)
                        return (
                          <td key={c} className="p-2" colSpan={2}>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">{String(raw ?? '—')}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                              <span className="text-green-400">{norm ? formatDate(norm) : '—'}</span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
