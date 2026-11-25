import Papa from 'papaparse'

/**
 * Parse a CSV or JSON file and return { data: [...rows], columns: [...colNames] }
 */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase()
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        if (ext === 'json') {
          let parsed = JSON.parse(e.target.result)
          if (!Array.isArray(parsed)) parsed = [parsed]
          const columns = parsed.length > 0 ? Object.keys(parsed[0]) : []
          resolve({ data: parsed, columns })
        } else {
          // CSV
          const result = Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
          })
          resolve({ data: result.data, columns: result.meta.fields || [] })
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Detect which evidence ID a file might be (from filename).
 * e.g. "E01_LedgerOne_API.csv" → "E01"
 */
export function detectEvidenceId(filename) {
  const match = filename.match(/E(\d{2})/i)
  if (match) return `E${match[1]}`
  return null
}

/**
 * Normalize a timestamp to UTC based on evidence source.
 * @param {string|number} ts - raw timestamp
 * @param {string} sourceType - 'UTC', 'UTC+5:30', 'Epoch+drift'
 * @param {number} driftSeconds - drift correction for E05 (seconds)
 * @returns {Date}
 */
export function normalizeTimestamp(ts, sourceType, driftSeconds = 0) {
  if (sourceType === 'Epoch+drift') {
    // Unix epoch in seconds or milliseconds
    let epoch = typeof ts === 'string' ? parseFloat(ts) : ts
    if (epoch > 1e12) epoch = epoch / 1000 // ms to s
    epoch -= driftSeconds // correct forward drift
    return new Date(epoch * 1000)
  }
  if (sourceType === 'UTC+5:30') {
    // Parse as local India time and subtract 5:30
    const d = new Date(ts)
    if (isNaN(d.getTime())) return null
    return new Date(d.getTime() - (5.5 * 60 * 60 * 1000))
  }
  // UTC or unknown — parse directly
  const d = new Date(ts)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Find timestamp columns in a dataset
 */
export function findTimestampColumns(columns) {
  const keywords = ['time', 'date', 'timestamp', 'created', 'logged', 'when', 'epoch']
  return columns.filter(c => keywords.some(k => c.toLowerCase().includes(k)))
}

/**
 * Check if an endpoint is high-risk
 */
export function isHighRiskEndpoint(endpoint) {
  if (!endpoint) return false
  const e = endpoint.toLowerCase()
  return e.includes('payment') || e.includes('vendor') || e.includes('bank') ||
    e.includes('export') || e.includes('delete') || e.includes('create job') ||
    e.includes('download')
}

/**
 * Check if an API key is the legacy ghost key
 */
export function isLegacyKey(keyId) {
  if (!keyId) return false
  return keyId.toLowerCase().includes('key-tb-03')
}

/**
 * Severity badge colors
 */
export function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return '#ef4444'
    case 'high': return '#f59e0b'
    case 'medium': return '#38bdf8'
    case 'low': return '#22c55e'
    default: return '#64748b'
  }
}

/**
 * Format date for display
 */
export function formatDate(d) {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}
