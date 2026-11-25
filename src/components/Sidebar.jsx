import React from 'react'
import {
  LayoutDashboard,
  Upload,
  Clock,
  GitBranch,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Shield,
} from 'lucide-react'
import { useStore } from '../store/useStore'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'evidence', label: 'Evidence Upload', icon: Upload },
  { id: 'clock', label: 'Clock Normalize', icon: Clock },
  { id: 'correlation', label: 'Correlation', icon: GitBranch },
  { id: 'anomaly', label: 'Anomaly Detect', icon: AlertTriangle },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'people', label: 'People & Keys', icon: Users },
  { id: 'report', label: 'Report Gen', icon: FileText },
]

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  return (
    <aside className="flex flex-col w-56 min-h-0 bg-[#1e293b] border-r border-white/5 py-3">
      <nav className="flex flex-col gap-1 px-2 overflow-y-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent cursor-pointer
                ${
                  isActive
                    ? 'tab-active text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export { TABS }
