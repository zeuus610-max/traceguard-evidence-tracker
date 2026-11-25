// Evidence metadata catalog
export const EVIDENCE_CATALOG = [
  { id: 'E01', name: 'LedgerOne API Log', format: 'CSV/JSON', tz: 'UTC', group: ['B','D'], desc: 'API access, exports, caller IPs, methods, status' },
  { id: 'E02', name: 'HelpDeskr Audit Log', format: 'CSV/JSON', tz: 'UTC+5:30', group: ['B','E'], desc: 'User actions, exports, timestamps' },
  { id: 'E03', name: 'SSO Log', format: 'CSV/JSON', tz: 'UTC', group: ['A'], desc: 'Staff login history, IPs, devices' },
  { id: 'E04', name: 'Connected Software Register', format: 'CSV/JSON', tz: 'N/A', group: ['C','D'], desc: 'API keys, permissions, owners, scopes' },
  { id: 'E05', name: 'BlueVault Access Log', format: 'CSV/JSON', tz: 'Epoch+drift', group: ['E'], desc: 'File access, downloads (clock skew)' },
  { id: 'E06', name: 'Billing Alert/Invoice', format: 'CSV/JSON', tz: '-', group: ['B'], desc: 'Unexpected export charges' },
  { id: 'E07', name: 'Onboarding Review', format: 'Doc', tz: '-', group: ['C'], desc: 'External company answers' },
  { id: 'E08', name: 'Contract Excerpt', format: 'Doc', tz: '-', group: ['C'], desc: 'Agreed responsibilities' },
  { id: 'E09', name: 'Risk Register', format: 'CSV/JSON', tz: '-', group: ['A'], desc: 'Known security risks' },
  { id: 'E10', name: 'IT Security Policy', format: 'Doc', tz: '-', group: ['A'], desc: 'Required security procedures' },
  { id: 'E11', name: 'Internal Audit Report', format: 'Doc', tz: '-', group: ['A'], desc: 'Previously identified issues' },
  { id: 'E12', name: 'External Email Notice', format: 'Doc', tz: '-', group: ['C'], desc: 'Initial external warning (21 Aug)' },
  { id: 'E13', name: 'Support Team Chat', format: 'Text', tz: '-', group: ['B'], desc: 'Internal discussions' },
  { id: 'E14', name: 'Staff Roster', format: 'CSV/JSON', tz: '-', group: ['A'], desc: 'Employee identity, status, dates' },
  { id: 'E15', name: 'Private-Link Flow Log', format: 'CSV/JSON', tz: 'UTC', group: ['C','E'], desc: 'Network traffic to external company' },
  { id: 'E16', name: 'Follow-up Email', format: 'Doc', tz: '-', group: ['C'], desc: 'Additional external warning' },
  { id: 'E17', name: 'Indicator List', format: 'CSV/JSON', tz: '-', group: ['C'], desc: 'External threat indicators (may be incomplete)' },
  { id: 'E18', name: 'Continued LedgerOne API Log', format: 'CSV/JSON', tz: 'UTC', group: ['D'], desc: 'September API activity' },
  { id: 'E19', name: 'Vendor Record Change Log', format: 'CSV/JSON', tz: 'UTC', group: ['D'], desc: 'Vendor bank detail changes, approvals' },
  { id: 'E20', name: 'Public Records Pack', format: 'Doc', tz: '-', group: ['C'], desc: 'External company public information' },
]

export const EVIDENCE_GROUPS = {
  A: { name: 'Identity', color: '#f59e0b', ids: ['E03','E14','E10','E11'], desc: 'Offboarding gaps, inactive accounts' },
  B: { name: 'Data Export', color: '#22c55e', ids: ['E02','E06','E13','E01'], desc: 'Unexpected exports vs. Tuesday cycle' },
  C: { name: 'External Integration', color: '#ef4444', ids: ['E04','E07','E08','E15','E12','E16','E17','E20'], desc: 'Third-party risk assessment' },
  D: { name: 'Financial', color: '#38bdf8', ids: ['E01','E18','E19','E04'], desc: 'Vendor bank changes, payment anomalies' },
  E: { name: 'File Access', color: '#a78bfa', ids: ['E05','E15','E02'], desc: 'Network flow vs. file access' },
}

export const KEY_PEOPLE = [
  { name: 'Dev Raghavan', role: 'General Manager', importance: 'Final decision-maker', icon: '👔' },
  { name: 'Madhavi Sundar', role: 'Finance Manager', importance: 'Reported unexpected export billing (24 Aug)', icon: '💰' },
  { name: 'Farah Dsouza', role: 'Senior Accountant', importance: 'Vendor audits', icon: '📊' },
  { name: 'Sunita Iyer', role: 'Support Team Lead', importance: 'Weekly Tuesday exports', icon: '🎧' },
  { name: 'Aditi Kapoor', role: 'IT Security Admin', importance: 'Acting security owner (CISO vacant since Sep 2025)', icon: '🔒' },
  { name: 'Pradeep Shah', role: 'IT Officer', importance: 'IT purchases and reviews', icon: '🖥️' },
  { name: 'Prakash Menon', role: 'Helpdesk Technician', importance: 'Staff IT problems', icon: '🔧' },
  { name: 'Colin Lawson', role: 'Network Contractor', importance: 'Works across cities — location changes ≠ suspicious', icon: '🌐' },
  { name: 'Rohan Menon', role: 'Former AP Clerk', importance: 'Left 30 Jun 2026; login reported active 13 Aug 2026', icon: '⚠️' },
]

export const API_KEYS = [
  { id: 'key-tb-07', owner: 'TallyBridge Connect', scope: 'Read/Write ALL LedgerOne modules', status: 'Active', risk: 'Critical', notes: 'Over-scoped — no IP restrictions or lifetime' },
  { id: 'tb-sync-svc', owner: 'TallyBridge Connect', scope: 'HelpDeskr Administrator', status: 'Active', risk: 'High', notes: 'Full admin scope on support platform' },
  { id: 'key-tb-03', owner: 'UNOWNED (Legacy)', scope: 'BLANK', status: 'Active', risk: 'Critical', notes: 'Ghost key — no owner, no scope, no review, no IP limits' },
]

export const TIMELINE_MILESTONES = [
  { date: '2024-06-01', event: 'TallyBridge Connect introduced', evidence: ['E07','E08'], system: 'TallyBridge', severity: 'info' },
  { date: '2025-01-01', event: 'Security Policy v2.1 begins', evidence: ['E10'], system: 'SSO', severity: 'info' },
  { date: '2025-02-01', event: 'Customer portal connected to BlueVault', evidence: ['E05'], system: 'BlueVault', severity: 'info' },
  { date: '2025-09-01', event: 'Internal audit report; CISO leaves', evidence: ['E11'], system: 'SSO', severity: 'warning' },
  { date: '2026-06-30', event: 'Rohan Menon leaves company', evidence: ['E14'], system: 'SSO', severity: 'warning' },
  { date: '2026-08-13', event: 'Former employee login still active', evidence: ['E03','E14'], system: 'SSO', severity: 'critical' },
  { date: '2026-08-21', event: 'External company warning arrives', evidence: ['E12','E16','E17'], system: 'TallyBridge', severity: 'critical' },
  { date: '2026-08-24', event: 'Unexpected export billing reported', evidence: ['E02','E06'], system: 'HelpDeskr', severity: 'critical' },
  { date: '2026-09-01', event: 'Audit committee asks about 2025 issues', evidence: ['E11','E09'], system: 'LedgerOne', severity: 'warning' },
  { date: '2026-09-03', event: 'Slow dispatch dashboard reported', evidence: ['E01','E05','E15'], system: 'LedgerOne', severity: 'high' },
  { date: '2026-09-07', event: 'Investigation requested', evidence: [], system: 'SSO', severity: 'critical' },
]

export const SYSTEM_COLORS = {
  LedgerOne: '#38bdf8',
  HelpDeskr: '#22c55e',
  SSO: '#f59e0b',
  BlueVault: '#a78bfa',
  TallyBridge: '#ef4444',
}
