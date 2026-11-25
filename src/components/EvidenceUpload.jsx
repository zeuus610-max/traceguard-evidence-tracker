import { useState, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { EVIDENCE_CATALOG } from '../data/constants'
import { parseFile, detectEvidenceId } from '../utils/helpers'
import { Upload, FileUp, Check, X, Eye, Trash2, AlertCircle } from 'lucide-react'

const PRIORITY_IDS = ['E01','E02','E03','E04','E05','E15','E18','E19']

export default function EvidenceUpload() {
  const { evidenceFiles, uploadEvidence, removeEvidence } = useStore()
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const [manualSelect, setManualSelect] = useState(null) // { file, resolve }
  const [error, setError] = useState(null)

  const uploadedCount = Object.keys(evidenceFiles).length
  const totalEvents = Object.values(evidenceFiles).reduce((s, e) => s + (e.rowCount || 0), 0)

  const handleFiles = useCallback(async (files) => {
    setError(null)
    for (const file of files) {
      try {
        const { data, columns } = await parseFile(file)
        let eid = detectEvidenceId(file.name)
        if (!eid) {
          // Show manual selector
          const selected = await new Promise((resolve) => {
            setManualSelect({ file, resolve })
          })
          setManualSelect(null)
          if (!selected) continue
          eid = selected
        }
        uploadEvidence(eid, data, columns, file.name)
      } catch (err) {
        setError(`Failed to parse ${file.name}: ${err.message}`)
      }
    }
  }, [uploadEvidence])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles([...e.dataTransfer.files])
  }

  const onFileInput = (e) => {
    if (e.target.files.length) handleFiles([...e.target.files])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Evidence Upload</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{uploadedCount}/20 files uploaded</span>
          <span className="text-sm text-cyan-400 font-mono">{totalEvents.toLocaleString()} events</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-navy-800 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-500"
          style={{ width: `${(uploadedCount / 20) * 100}%` }}
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${dragOver ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-600 hover:border-slate-500'}`}
        onClick={() => document.getElementById('file-input').click()}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-cyan-400' : 'text-slate-500'}`} />
        <p className="text-lg font-medium text-slate-300">Drop CSV or JSON evidence files here</p>
        <p className="text-sm text-slate-500 mt-1">Files named E01–E20 are auto-detected</p>
        <input id="file-input" type="file" multiple accept=".csv,.json" onChange={onFileInput} className="hidden" />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Manual selector modal */}
      {manualSelect && (
        <div className="glass-card rounded-xl p-6 border border-amber-500/30">
          <p className="text-amber-400 font-medium mb-3">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Could not auto-detect evidence ID for "{manualSelect.file.name}"
          </p>
          <div className="flex flex-wrap gap-2">
            {EVIDENCE_CATALOG.filter(e => !evidenceFiles[e.id]).map(e => (
              <button key={e.id} onClick={() => manualSelect.resolve(e.id)}
                className="px-3 py-1.5 text-sm rounded-lg bg-navy-700 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors font-mono">
                {e.id}
              </button>
            ))}
            <button onClick={() => manualSelect.resolve(null)}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Priority callout */}
      <div className="glass-card rounded-xl p-4 border-l-4 border-amber-500">
        <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Priority Files — Upload these first for core analysis
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {PRIORITY_IDS.map(id => (
            <span key={id} className={`px-2 py-1 rounded text-xs font-mono
              ${evidenceFiles[id] ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {id} {evidenceFiles[id] ? '✓' : '✗'}
            </span>
          ))}
        </div>
      </div>

      {/* Evidence grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {EVIDENCE_CATALOG.map(e => {
          const uploaded = evidenceFiles[e.id]
          const isPriority = PRIORITY_IDS.includes(e.id)
          return (
            <div key={e.id}
              className={`glass-card rounded-xl p-4 transition-all ${isPriority && !uploaded ? 'border-amber-500/30' : ''}
                ${uploaded ? 'border-green-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-mono font-bold ${uploaded ? 'text-green-400' : 'text-slate-400'}`}>
                  {e.id}
                </span>
                <div className="flex items-center gap-1">
                  {uploaded && (
                    <>
                      <button onClick={() => setPreview(e.id)} className="p-1 hover:text-cyan-400 text-slate-500">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { removeEvidence(e.id); if (preview === e.id) setPreview(null) }}
                        className="p-1 hover:text-red-400 text-slate-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {uploaded ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-slate-600" />}
                </div>
              </div>
              <p className="text-xs font-medium text-slate-300 truncate">{e.name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{e.desc}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="bg-navy-700 px-1.5 py-0.5 rounded">{e.tz}</span>
                {uploaded && (
                  <span className="text-cyan-400 font-mono">{uploaded.rowCount} rows</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview table */}
      {preview && evidenceFiles[preview] && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-cyan-400 font-mono">{preview} — Preview (first 5 rows)</h3>
            <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  {evidenceFiles[preview].columns.map(c => <th key={c} className="text-left p-2 whitespace-nowrap">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {evidenceFiles[preview].data.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-white/5">
                    {evidenceFiles[preview].columns.map(c => (
                      <td key={c} className="p-2 text-slate-300 whitespace-nowrap max-w-[200px] truncate">{String(row[c] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
