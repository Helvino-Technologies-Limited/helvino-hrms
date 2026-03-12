'use client'
import { useEffect, useState } from 'react'
import { FolderOpen, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const SERVICE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const MILESTONE_ICONS: Record<string, any> = {
  PENDING: Clock,
  IN_PROGRESS: AlertCircle,
  COMPLETED: CheckCircle,
}
const MILESTONE_COLORS: Record<string, string> = {
  PENDING: 'text-slate-400',
  IN_PROGRESS: 'text-blue-500',
  COMPLETED: 'text-green-500',
}

export default function ProjectsPage() {
  const [data, setData] = useState<any>({ projects: [], services: [] })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/client/projects')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasContent = data.projects.length > 0 || data.services.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track the progress of your active projects and services</p>
      </div>

      {!hasContent ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No projects yet</h3>
          <p className="text-slate-400 text-sm mt-1">Your projects will appear here once work begins.</p>
        </div>
      ) : (
        <>
          {/* Client Projects with Milestones */}
          {data.projects.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Projects</h2>
              <div className="space-y-4">
                {data.projects.map((project: any) => (
                  <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-700'}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 mt-1 text-lg">{project.name}</h3>
                          {project.description && <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>}

                          {/* Progress bar */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-600">Progress</span>
                              <span className="text-xs font-bold text-slate-900">{project.progress}%</span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                            {project.startDate && <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>}
                            {project.estimatedEnd && <span>Est. completion: {new Date(project.estimatedEnd).toLocaleDateString()}</span>}
                            {project.assignedTeam && <span>Team: {project.assignedTeam}</span>}
                          </div>
                        </div>
                        {project.milestones.length > 0 && (
                          <button
                            onClick={() => setExpanded(expanded === project.id ? null : project.id)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold flex-shrink-0"
                          >
                            Milestones
                            {expanded === project.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Milestones */}
                    {expanded === project.id && project.milestones.length > 0 && (
                      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Project Milestones</h4>
                        <div className="space-y-3">
                          {project.milestones.map((m: any, i: number) => {
                            const Icon = MILESTONE_ICONS[m.status] || Clock
                            return (
                              <div key={m.id} className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                  <Icon className={`w-5 h-5 ${MILESTONE_COLORS[m.status]}`} />
                                  {i < project.milestones.length - 1 && (
                                    <div className="absolute top-5 left-2 w-0.5 h-6 bg-slate-200" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold ${m.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                      {m.title}
                                    </span>
                                    {m.status === 'COMPLETED' && (
                                      <span className="text-xs text-green-600 font-medium">Done</span>
                                    )}
                                  </div>
                                  {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                                  {m.dueDate && (
                                    <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Services */}
          {data.services.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Active Services</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.services.map((svc: any) => (
                  <div key={svc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{svc.serviceName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${SERVICE_STATUS_COLORS[svc.status] || 'bg-slate-100 text-slate-700'}`}>
                        {svc.status.replace('_', ' ')}
                      </span>
                    </div>
                    {svc.description && <p className="text-sm text-slate-500 mt-1">{svc.description}</p>}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      {svc.startDate && <span>Start: {new Date(svc.startDate).toLocaleDateString()}</span>}
                      {svc.completionDate && <span>Due: {new Date(svc.completionDate).toLocaleDateString()}</span>}
                      {svc.assignedTeam && <span>Team: {svc.assignedTeam}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
