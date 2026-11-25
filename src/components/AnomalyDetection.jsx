import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { EVIDENCE_CATALOG } from '../data/constants'
import { isHighRiskEndpoint, isLegacyKey, getSeverityColor, formatDate } from '../utils/helpers'
import { AlertTriangle, Shield, KeyRound, UserX, Download, FileWarning, Eye } from 'lucide-react'

export default function AnomalyDetection() {
  const { evidenceFiles, normalizedData, anomalies, setAnomalies } = useStore()

  const detectedAnomalies = useMemo(() => {
    const results = []

    // Scan all uploaded evidence for anomalies
    Object.entries(evidenceFiles).forEach(([eid, fileData]) => {
      const data = normalizedData[eid] || fileData.data
      if (!data) return

      data.forEach((row, idx) => {
        const ep = row.ENDPOINT || row.endpoint || row.path || ''
        const key = row.API_KEY_ID || row.api_key_id || row.api_key || row.key_id || ''
        const method = row.METHOD || row.method || ''
        const userAgent = row.USER_AGENT || row.user_agent || ''
        const callerIp = row.CALLER_IP || row.caller_ip || row.ip || ''
        const status = row.STATUS || row.status || ''
        const ts = row.TIMESTAMP || row.timestamp || row.time || row.date || ''

        // 1. Legacy key canary
        if (isLegacyKey(key)) {
          results.push({
            id: `${eid}-${idx}-canary`,
            type: 'Legacy Key Canary',
            severity: 'critical',
            evidence: [eid],
            timestamp: ts,
            description: `Ghost key key-tb-03 detected in ${eid} — endpoint: ${ep}, IP: ${callerIp}`,
            details: row,
            icon: 'key',
          })
        }

        // 2. High-risk endpoint access
        if (isHighRiskEndpoint(ep)) {
          results.push({
            id: `${eid}-${idx}-highrisk`,
            type: 'High-Risk API Access',
            severity: 'high',
            evidence: [eid],
            timestamp: ts,
            description: `Sensitive endpoint accessed: ${ep} via ${method} by key ${key}`,
            details: row,
            icon: 'shield',
          })
        }

        // 3. User-agent anomaly
        if (userAgent && (userAgent.includes('backup-agent') || userAgent.includes('3.4.1'))) {
          results.push({
            id: `${eid}-${idx}-agent`,
            type: 'User-Agent Anomaly',
            severity: 'medium',
            evidence: [eid],
            timestamp: ts,
            description: `Unexpected user-agent detected: ${userAgent} (expected TallyBridge-Sync 3.5.0)`,
            details: row,
            icon: 'warning',
          })
        }

        // 4. Non-Tuesday exports (check E02)
        if (eid === 'E02' && ep.toLowerCase().includes('export')) {
          const d = new Date(ts)
          if (!isNaN(d.getTime()) && d.getDay() !== 2) { // 2 = Tuesday
            results.push({
              id: `${eid}-${idx}-export`,
              type: 'Non-Tuesday Export',
              severity: 'high',
              evidence: [eid],
              timestamp: ts,
              description: `Export operation on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]} (expected: Tuesday only)`,
              details: row,
              icon: 'download',
            })
          }
        }

        // 5. Vendor bank detail changes without approval (E19)
        if (eid === 'E19') {
          const approval = row.APPROVAL_REFERENCE || row.approval_reference || row.approval || ''
          if (!approval || approval === '' || approval === 'null' || approval === 'N/A') {
            results.push({
              id: `${eid}-${idx}-noapproval`,
              type: 'Unapproved Vendor Modification',
              severity: 'critical',
              evidence: [eid],
              timestamp: ts,
              description: `Vendor bank detail change with no approval reference — Vendor: ${row.VENDOR_ID || row.vendor_id || '?'}`,
              details: row,
              icon: 'warning',
            })
          }
        }
      })
    })

    // 6. Check for former employee activity (E03 + E14)
    if (evidenceFiles.E14?.data && evidenceFiles.E03?.data) {
      const formerEmployees = evidenceFiles.E14.data
        .filter(r => {
          const s = (r.STATUS || r.status || '').toLowerCase()
          return s === 'left' || s === 'terminated' || s === 'inactive' || s === 'former'
        })
        .map(r => (r.USERNAME || r.username || r.user_id || r.name || '').toLowerCase())
        .filter(Boolean)

      const ssoData = normalizedData.E03 || evidenceFiles.E03.data
      ssoData.forEach((row, idx) => {
        const user = (row.USERNAME || row.username || row.user_id || '').toLowerCase()
        if (formerEmployees.includes(user)) {
          results.push({
            id: `E03-${idx}-former`,
            type: 'Former Employee Login',
            severity: 'critical',
            evidence: ['E03', 'E14'],
            timestamp: row.TIMESTAMP || row.timestamp || row.time || '',
            description: `Former employee "${user}" login detected after departure`,
            details: row,
            icon: 'user',
          })
        }
      })
    }

    return results.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 }
      return (sev[a.severity] ?? 4) - (sev[b.severity] ?? 4)
    })
  }, [evidenceFiles, normalizedData])

  // Update store
  useMemo(() => {
    if (detectedAnomalies.length && detectedAnomalies.length !== anomalies.length) {
      setAnomalies(detectedAnomalies)
    }
  }, [detectedAnomalies])

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    detectedAnomalies.forEach(a => { counts[a.severity] = (counts[a.severity] || 0) + 1 })
    return counts
  }, [detectedAnomalies])

  const typeCounts = useMemo(() => {
    const counts = {}
    detectedAnomalies.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1 })
    return counts
  }, [detectedAnomalies])

  const IconMap = { key: KeyRound, shield: Shield, warning: AlertTriangle, download: Download, user: UserX }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <AlertTriangle className="w-7 h-7 text-red-400" /> Anomaly Detection
      </h2>

      {/* Severity summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(severityCounts).map(([sev, count]) => (
          <div key={sev} className="glass-card rounded-xl p-4 text-center">
            <p className="text-3xl font-bold font-mono" style={{ color: getSeverityColor(sev) }}>{count}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-medium">{sev}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(typeCounts).map(([type, count]) => (
          <span key={type} className="px-3 py-1.5 rounded-full text-xs font-medium bg-navy-800 text-slate-300 border border-slate-700">
            {type} <span className="text-cyan-400 font-mono ml-1">{count}</span>
          </span>
        ))}
      </div>

      {/* No data state */}
      {detectedAnomalies.length === 0 && (
        <div className="glass-card rounded-xl p-10 text-center">
          <FileWarning className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No anomalies detected yet.</p>
          <p className="text-xs text-slate-600 mt-1">Upload evidence files to begin scanning for suspicious activity.</p>
        </div>
      )}

      {/* Anomaly list */}
      <div className="space-y-3">
        {detectedAnomalies.slice(0, 100).map(a => {
          const Icon = IconMap[a.icon] || AlertTriangle
          return (
            <div key={a.id} className={`glass-card rounded-xl p-4 border-l-4 transition-all hover:bg-white/5`}
              style={{ borderLeftColor: getSeverityColor(a.severity) }}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${getSeverityColor(a.severity)}20` }}>
                  <Icon className="w-5 h-5" style={{ color: getSeverityColor(a.severity) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded uppercase"
                      style={{ backgroundColor: `${getSeverityColor(a.severity)}20`, color: getSeverityColor(a.severity) }}>
                      {a.severity}
                    </span>
                    <span className="text-sm font-medium text-white">{a.type}</span>
                    <div className="flex gap-1 ml-auto">
                      {a.evidence.map(e => (
                        <span key={e} className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{e}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">{a.description}</p>
                  {a.timestamp && (
                    <p className="text-xs text-slate-500 font-mono mt-1">{String(a.timestamp)}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {detectedAnomalies.length > 100 && (
          <p className="text-center text-xs text-slate-500">Showing 100 of {detectedAnomalies.length} anomalies</p>
        )}
      </div>
    </div>
  )
}
