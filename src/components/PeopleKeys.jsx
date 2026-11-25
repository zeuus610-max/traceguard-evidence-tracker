import { KEY_PEOPLE, API_KEYS } from '../data/constants'
import { useStore } from '../store/useStore'
import { Users, KeyRound, Shield, AlertTriangle, UserX } from 'lucide-react'

export default function PeopleKeys() {
  const { evidenceFiles } = useStore()

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <Users className="w-7 h-7 text-cyan-400" /> People & API Keys
      </h2>

      {/* Key People */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Key Personnel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {KEY_PEOPLE.map(p => (
            <div key={p.name} className={`glass-card rounded-xl p-5 transition-all hover:bg-white/5
              ${p.name === 'Rohan Menon' ? 'border-red-500/30 border-l-4' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-sm text-cyan-400">{p.role}</p>
                  <p className="text-xs text-slate-400 mt-2">{p.importance}</p>
                  {p.name === 'Rohan Menon' && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-400">
                      <UserX className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Person of Interest — Requires Investigation</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 italic flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          None of these individuals should be labeled "attacker" without supporting evidence.
        </p>
      </div>

      {/* API Keys */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" /> API Credentials Under Investigation
        </h3>
        <div className="space-y-4">
          {API_KEYS.map(k => (
            <div key={k.id} className={`glass-card rounded-xl p-5 border-l-4
              ${k.risk === 'Critical' ? 'border-red-500' : 'border-amber-500'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono font-bold text-white bg-navy-700 px-3 py-1 rounded">{k.id}</code>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase
                    ${k.risk === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {k.risk}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 font-medium">{k.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Owner</p>
                  <p className={`font-medium ${k.owner.includes('UNOWNED') ? 'text-red-400' : 'text-slate-300'}`}>{k.owner}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Scope</p>
                  <p className={`font-medium font-mono text-xs ${k.scope === 'BLANK' ? 'text-red-400' : 'text-slate-300'}`}>{k.scope}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Notes</p>
                  <p className="text-slate-400 text-xs">{k.notes}</p>
                </div>
              </div>
              {k.id === 'key-tb-03' && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    CANARY TRAP RECOMMENDED — Any activity from this key should trigger immediate containment
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
