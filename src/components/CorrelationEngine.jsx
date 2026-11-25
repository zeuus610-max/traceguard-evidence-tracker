import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { EVIDENCE_GROUPS } from '../data/constants'
import { isHighRiskEndpoint, isLegacyKey, formatDate, normalizeTimestamp } from '../utils/helpers'
import { GitBranch, Search, Filter, AlertTriangle, Link, Unlink, Shield } from 'lucide-react'

export default function CorrelationEngine() {
  const { evidenceFiles, normalizedData } = useStore()
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [filters, setFilters] = useState({ search: '', apiKey: '', endpoint: '' })

  const groupData = useMemo(() => {
    if (!selectedGroup) return []
    const group = EVIDENCE_GROUPS[selectedGroup]
    if (!group) return []

    const allRows = []
    group.ids.forEach(eid => {
      const src = normalizedData[eid] || evidenceFiles[eid]?.data
      if (!src) return
      src.forEach(row => {
        allRows.push({ ...row, _source: eid })
      })
    })
    return allRows
  }, [selectedGroup, evidenceFiles, normalizedData])

  const filteredData = useMemo(() => {
    let data = groupData
    if (filters.search) {
      const s = filters.search.toLowerCase()
      data = data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(s)))
    }
    if (filters.apiKey) {
      data = data.filter(row => {
        const key = row.API_KEY_ID || row.api_key_id || row.api_key || row.key_id || ''
        return String(key).toLowerCase().includes(filters.apiKey.toLowerCase())
      })
    }
    if (filters.endpoint) {
      data = data.filter(row => {
        const ep = row.ENDPOINT || row.endpoint || row.path || ''
        return String(ep).toLowerCase().includes(filters.endpoint.toLowerCase())
      })
    }
    return data
  }, [groupData, filters])

  // Analyze rows
  const analysis = useMemo(() => {
    let highRisk = 0, orphaned = 0, matched = 0, canaryHits = 0
    filteredData.forEach(row => {
      const ep = row.ENDPOINT || row.endpoint || row.path || ''
      const key = row.API_KEY_ID || row.api_key_id || row.api_key || row.key_id || ''
      if (isHighRiskEndpoint(ep)) highRisk++
      if (isLegacyKey(key)) canaryHits++
    })
    // Simple twin-matching: group by request_id or timestamp proximity
    const sourceGroups = {}
    filteredData.forEach(row => {
      const rid = row.REQUEST_ID || row.request_id || row.req_id
      if (rid) {
        if (!sourceGroups[rid]) sourceGroups[rid] = []
        sourceGroups[rid].push(row)
      }
    })
    Object.values(sourceGroups).forEach(group => {
      const sources = new Set(group.map(r => r._source))
      if (sources.size > 1) matched += group.length
      else orphaned += group.length
    })
    return { total: filteredData.length, highRisk, orphaned, matched, canaryHits }
  }, [filteredData])

  const getRowFlags = (row) => {
    const flags = []
    const ep = row.ENDPOINT || row.endpoint || row.path || ''
    const key = row.API_KEY_ID || row.api_key_id || row.api_key || row.key_id || ''
    if (isHighRiskEndpoint(ep)) flags.push('high-risk')
    if (isLegacyKey(key)) flags.push('canary')
    return flags
  }

  const displayCols = useMemo(() => {
    if (!filteredData.length) return []
    const allKeys = new Set()
    filteredData.slice(0, 50).forEach(row => Object.keys(row).forEach(k => { if (!k.startsWith('_')) allKeys.add(k) }))
    return [...allKeys].slice(0, 10) // Show max 10 columns
  }, [filteredData])

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <GitBranch className="w-7 h-7 text-cyan-400" /> Correlation Engine
      </h2>

      {/* Group selector */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(EVIDENCE_GROUPS).map(([key, group]) => (
          <button key={key} onClick={() => setSelectedGroup(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
              ${selectedGroup === key
                ? 'border-opacity-50 bg-opacity-20 text-white'
                : 'border-slate-700 bg-navy-800 text-slate-400 hover:text-white hover:border-slate-500'}`}
            style={selectedGroup === key ? { borderColor: group.color, backgroundColor: `${group.color}20`, color: group.color } : {}}>
            <span className="font-bold mr-1.5">Group {key}</span>
            {group.name}
            <span className="ml-2 text-xs opacity-60">{group.ids.join(', ')}</span>
          </button>
        ))}
      </div>

      {selectedGroup && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total Records', value: analysis.total, color: 'text-cyan-400' },
              { label: 'High-Risk Calls', value: analysis.highRisk, color: 'text-amber-400' },
              { label: 'Matched Twins', value: analysis.matched, color: 'text-green-400' },
              { label: 'Orphaned Actions', value: analysis.orphaned, color: 'text-red-400' },
              { label: 'Canary Key Hits', value: analysis.canaryHits, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search all fields..." value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 bg-navy-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <input type="text" placeholder="Filter API Key..." value={filters.apiKey}
              onChange={e => setFilters(f => ({ ...f, apiKey: e.target.value }))}
              className="px-3 py-2 bg-navy-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 w-48 font-mono" />
            <input type="text" placeholder="Filter Endpoint..." value={filters.endpoint}
              onChange={e => setFilters(f => ({ ...f, endpoint: e.target.value }))}
              className="px-3 py-2 bg-navy-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 w-48 font-mono" />
          </div>

          {/* Results table */}
          {filteredData.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <p className="text-slate-500">No evidence data loaded for this group. Upload the required files first.</p>
              <p className="text-xs text-slate-600 mt-2">Required: {EVIDENCE_GROUPS[selectedGroup].ids.join(', ')}</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-xs font-mono">
                  <thead className="sticky top-0 bg-navy-800 z-10">
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left p-2">Src</th>
                      <th className="text-left p-2">Flags</th>
                      {displayCols.map(c => <th key={c} className="text-left p-2 whitespace-nowrap">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 200).map((row, i) => {
                      const flags = getRowFlags(row)
                      return (
                        <tr key={i} className={`border-b border-slate-800 hover:bg-white/5
                          ${flags.includes('canary') ? 'bg-red-500/10' : flags.includes('high-risk') ? 'bg-amber-500/5' : ''}`}>
                          <td className="p-2 text-cyan-400">{row._source}</td>
                          <td className="p-2">
                            {flags.includes('canary') && (
                              <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] mr-1">CANARY</span>
                            )}
                            {flags.includes('high-risk') && (
                              <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">HIGH-RISK</span>
                            )}
                          </td>
                          {displayCols.map(c => (
                            <td key={c} className="p-2 text-slate-300 whitespace-nowrap max-w-[180px] truncate">{String(row[c] ?? '')}</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredData.length > 200 && (
                <div className="p-2 text-center text-xs text-slate-500">Showing 200 of {filteredData.length} records</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
