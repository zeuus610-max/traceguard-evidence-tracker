import { useState, useEffect, useRef } from 'react'
import { Shield, Zap, Lock, Unlock, AlertTriangle, Check, X, KeyRound, Activity, Server, ArrowRight, Ban } from 'lucide-react'

// Simulated API Gateway state
const GATEWAY_RULES = [
  { id: 'twin-proof', name: 'Twin-Proof Corroboration', desc: 'Every high-risk API call must have a matching record in another system', icon: 'link', enabled: true, blocked: 0, allowed: 0 },
  { id: 'behavioral', name: '4-Factor Behavioral Fingerprint', desc: 'Bind [Key ID + User-Agent + Subnet + Sync-Window] and flag deviations', icon: 'fingerprint', enabled: true, blocked: 0, allowed: 0 },
  { id: 'canary', name: 'Legacy Key Canary Trap', desc: 'Route key-tb-03 traffic to quarantine — any hit = instant alert', icon: 'key', enabled: true, blocked: 0, allowed: 0 },
  { id: 'scope', name: 'Least-Privilege Scope Enforcer', desc: 'Block access to /payments/*, /vendors/banking/* unless explicitly allowed', icon: 'lock', enabled: true, blocked: 0, allowed: 0 },
  { id: 'export-guard', name: 'Export Lifecycle Monitor', desc: 'Detect rapid Create→Download→Delete sequences and block silent cleanup', icon: 'download', enabled: true, blocked: 0, allowed: 0 },
  { id: 'clock-sync', name: 'Drift-Aware Time Normalizer', desc: 'Force UTC normalization on all inbound/outbound sync transactions', icon: 'clock', enabled: true, blocked: 0, allowed: 0 },
  { id: 'mfa-gate', name: 'Dual-Control Approval Gate', desc: 'Vendor bank modifications require 2FA approval from Finance + Security', icon: 'shield', enabled: true, blocked: 0, allowed: 0 },
]

// Simulated inbound API requests
const SAMPLE_REQUESTS = [
  { id: 1, method: 'GET', endpoint: '/api/v1/tickets/search', key: 'key-tb-07', agent: 'TallyBridge-Sync 3.5.0', ip: '172.16.3.42', subnet: '172.16.0.0/16', risk: 'low', result: 'allow', rule: null, time: 0 },
  { id: 2, method: 'GET', endpoint: '/api/v1/payments/search', key: 'key-tb-07', agent: 'TallyBridge-Sync 3.5.0', ip: '172.16.3.42', subnet: '172.16.0.0/16', risk: 'high', result: 'review', rule: 'twin-proof', time: 1200 },
  { id: 3, method: 'POST', endpoint: '/api/v1/vendors/banking/update', key: 'key-tb-03', agent: 'backup-agent 2.1', ip: '10.20.4.15', subnet: '10.20.4.0/24', risk: 'critical', result: 'block', rule: 'canary', time: 2400 },
  { id: 4, method: 'POST', endpoint: '/api/v1/exports/create', key: 'key-tb-07', agent: 'TallyBridge-Sync 3.4.1', ip: '103.47.22.198', subnet: 'ISP', risk: 'high', result: 'block', rule: 'behavioral', time: 3600 },
  { id: 5, method: 'GET', endpoint: '/api/v1/invoices/list', key: 'tb-sync-svc', agent: 'TallyBridge-Sync 3.5.0', ip: '172.16.1.10', subnet: '172.16.0.0/16', risk: 'low', result: 'allow', rule: null, time: 4800 },
  { id: 6, method: 'DELETE', endpoint: '/api/v1/exports/job/4821', key: 'key-tb-07', agent: 'TallyBridge-Sync 3.5.0', ip: '172.16.3.42', subnet: '172.16.0.0/16', risk: 'critical', result: 'block', rule: 'export-guard', time: 5500 },
  { id: 7, method: 'PUT', endpoint: '/api/v1/vendors/banking/IBAN', key: 'key-tb-07', agent: 'HF-Portal 5.2', ip: '172.16.1.5', subnet: '172.16.0.0/16', risk: 'critical', result: 'hold', rule: 'mfa-gate', time: 6200 },
  { id: 8, method: 'GET', endpoint: '/api/v1/customers/export', key: 'key-tb-03', agent: 'backup-agent 2.1', ip: '10.20.4.15', subnet: '10.20.4.0/24', risk: 'critical', result: 'block', rule: 'canary', time: 7000 },
  { id: 9, method: 'GET', endpoint: '/api/v1/dispatch/status', key: 'tb-sync-svc', agent: 'TallyBridge-Sync 3.5.0', ip: '172.16.3.42', subnet: '172.16.0.0/16', risk: 'low', result: 'allow', rule: null, time: 7800 },
  { id: 10, method: 'POST', endpoint: '/api/v1/payments/transfer', key: 'key-tb-07', agent: 'TallyBridge-Sync 3.5.0', ip: '172.16.3.42', subnet: '172.16.0.0/16', risk: 'critical', result: 'review', rule: 'scope', time: 8600 },
]

export default function APIGateway() {
  const [rules, setRules] = useState(GATEWAY_RULES)
  const [liveLog, setLiveLog] = useState([])
  const [simRunning, setSimRunning] = useState(false)
  const [simIndex, setSimIndex] = useState(0)
  const logRef = useRef(null)

  const toggleRule = (id) => {
    setRules(r => r.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
  }

  // Run simulation
  useEffect(() => {
    if (!simRunning || simIndex >= SAMPLE_REQUESTS.length) {
      if (simIndex >= SAMPLE_REQUESTS.length) setSimRunning(false)
      return
    }
    const timer = setTimeout(() => {
      const req = SAMPLE_REQUESTS[simIndex]
      const matchedRule = rules.find(r => r.id === req.rule)
      const isRuleActive = matchedRule ? matchedRule.enabled : true
      const finalResult = req.result === 'block' && !isRuleActive ? 'allow (rule disabled!)' : req.result

      setLiveLog(prev => [...prev, {
        ...req,
        result: finalResult,
        processedAt: new Date().toISOString(),
        ruleActive: isRuleActive,
      }])

      // Update rule stats
      if (req.rule) {
        setRules(r => r.map(rule => {
          if (rule.id !== req.rule) return rule
          if (finalResult.includes('block')) return { ...rule, blocked: rule.blocked + 1 }
          if (finalResult.includes('allow')) return { ...rule, allowed: rule.allowed + 1 }
          return rule
        }))
      }

      setSimIndex(i => i + 1)
    }, 800)
    return () => clearTimeout(timer)
  }, [simRunning, simIndex, rules])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [liveLog])

  const startSim = () => {
    setLiveLog([])
    setSimIndex(0)
    setRules(GATEWAY_RULES.map(r => ({ ...r, blocked: 0, allowed: 0 })))
    setSimRunning(true)
  }

  const stats = {
    total: liveLog.length,
    allowed: liveLog.filter(l => l.result === 'allow').length,
    blocked: liveLog.filter(l => l.result.includes('block')).length,
    review: liveLog.filter(l => l.result === 'review').length,
    hold: liveLog.filter(l => l.result === 'hold').length,
    bypassed: liveLog.filter(l => l.result.includes('rule disabled')).length,
  }

  const getResultStyle = (result) => {
    if (result.includes('block')) return 'bg-red-500/20 text-red-400'
    if (result === 'allow') return 'bg-green-500/20 text-green-400'
    if (result === 'review') return 'bg-amber-500/20 text-amber-400'
    if (result === 'hold') return 'bg-cyan-500/20 text-cyan-400'
    if (result.includes('disabled')) return 'bg-red-700/30 text-red-300'
    return 'bg-slate-700 text-slate-400'
  }

  const getRiskStyle = (risk) => {
    if (risk === 'critical') return 'text-red-400'
    if (risk === 'high') return 'text-amber-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-7 h-7 text-cyan-400 animate-pulse-glow" /> API Gateway Firewall
        </h2>
        <div className="flex gap-3">
          <button onClick={startSim} disabled={simRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all
              ${simRunning
                ? 'bg-amber-500/20 text-amber-400 cursor-wait'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'}`}>
            <Zap className={`w-4 h-4 ${simRunning ? 'animate-pulse' : ''}`} />
            {simRunning ? `Processing ${simIndex}/${SAMPLE_REQUESTS.length}...` : 'Run Attack Simulation'}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Real-time API gateway sitting between TallyBridge Connect and Harbor & Finch's backend systems.
        Every request is inspected, fingerprinted, and corroborated before passing through.
      </p>

      {/* Architecture diagram */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center w-44">
            <Server className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 font-bold text-xs">TallyBridge / Attacker</p>
            <p className="text-slate-500 text-[10px]">Inbound API requests</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-500" />
          <div className="bg-cyan-500/10 border-2 border-cyan-500/40 rounded-xl p-4 text-center w-56 animate-pulse-glow">
            <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-cyan-400 font-bold">TRACEGUARD GATEWAY</p>
            <p className="text-slate-400 text-[10px]">{rules.filter(r => r.enabled).length}/{rules.length} rules active</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-500" />
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center w-44">
            <Server className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-bold text-xs">LedgerOne / HelpDeskr</p>
            <p className="text-slate-500 text-[10px]">Protected backends</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Allowed', value: stats.allowed, color: 'text-green-400' },
          { label: 'Blocked', value: stats.blocked, color: 'text-red-400' },
          { label: 'Review', value: stats.review, color: 'text-amber-400' },
          { label: 'On Hold', value: stats.hold, color: 'text-cyan-400' },
          { label: 'Bypassed⚠', value: stats.bypassed, color: 'text-red-300' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Gateway Rules */}
        <div>
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" /> Gateway Rules
          </h3>
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className={`glass-card rounded-lg p-3 flex items-center gap-3 transition-all
                ${rule.enabled ? 'border-green-500/20' : 'border-red-500/20 opacity-60'}`}>
                <button onClick={() => toggleRule(rule.id)}
                  className={`w-10 h-6 rounded-full transition-all flex items-center px-1
                    ${rule.enabled ? 'bg-green-500' : 'bg-slate-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform
                    ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200">{rule.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{rule.desc}</p>
                </div>
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="text-green-400">{rule.allowed}✓</span>
                  <span className="text-red-400">{rule.blocked}✗</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live request log */}
        <div>
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Live Request Log
          </h3>
          <div ref={logRef} className="glass-card rounded-lg overflow-y-auto max-h-[420px] divide-y divide-slate-800">
            {liveLog.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Click "Run Attack Simulation" to see the gateway in action
              </div>
            ) : (
              liveLog.map((req, i) => (
                <div key={i} className="p-3 hover:bg-white/5 animate-slide-in">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${getResultStyle(req.result)}`}>
                      {req.result.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{req.method}</span>
                    <span className="text-xs font-mono text-slate-400 truncate flex-1">{req.endpoint}</span>
                    <span className={`text-[10px] font-bold ${getRiskStyle(req.risk)}`}>{req.risk.toUpperCase()}</span>
                  </div>
                  <div className="flex gap-3 text-[10px] text-slate-500 font-mono">
                    <span>Key: <span className={req.key === 'key-tb-03' ? 'text-red-400' : 'text-slate-400'}>{req.key}</span></span>
                    <span>UA: {req.agent}</span>
                    <span>IP: {req.ip}</span>
                    {req.rule && (
                      <span className="text-cyan-400">Rule: {req.rule}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comparison: Before vs After */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Before vs After: Legacy TallyBridge → TraceGuard Gateway</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left p-3">Security Vector</th>
                <th className="text-left p-3"><span className="text-red-400">Legacy TallyBridge</span></th>
                <th className="text-left p-3"><span className="text-green-400">TraceGuard Gateway</span></th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ['Authentication', 'Static eternal plain-text keys', 'Ephemeral 300s tokens + mTLS'],
                ['Legacy Key Risk', 'Unmonitored ghost keys (key-tb-03)', 'Canary trap — instant quarantine'],
                ['Financial Module Access', 'Unrestricted read/write all modules', 'Hard-block on /payments /vendors/banking'],
                ['Export Protection', 'Silent Create→Download→Delete', 'WORM audit log — deletion prohibited'],
                ['Network Verification', 'Blind trust of 10.20.4.0/24', 'Zero-trust per-request verification'],
                ['Approval Workflow', 'Headless automated execution', 'Dual-key MFA for financial mutations'],
                ['Clock Handling', 'Mixed UTC / UTC+5:30 / epoch drift', 'Forced UTC normalization on all traffic'],
              ].map(([vector, legacy, secure]) => (
                <tr key={vector} className="border-b border-slate-800 hover:bg-white/5">
                  <td className="p-3 font-medium text-slate-300">{vector}</td>
                  <td className="p-3 text-red-300 flex items-center gap-1.5"><X className="w-3 h-3 text-red-500 shrink-0" /> {legacy}</td>
                  <td className="p-3 text-green-300"><Check className="w-3 h-3 text-green-500 inline mr-1.5" />{secure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
