// client/src/components/AgentCard.jsx
import { CheckCircle2, AlertTriangle, UserRound } from 'lucide-react'

export default function AgentCard({ title, agent, tone = 'neutral', note }) {
  const styles = {
    red: 'border-rose-300 bg-rose-50/95 text-rose-950 dark:bg-rose-950/50 dark:text-rose-50 dark:border-rose-800',
    green: 'border-emerald-300 bg-emerald-50/95 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50 dark:border-emerald-800',
    neutral: 'border-amber-200 bg-white/90 text-stone-800 dark:bg-stone-900/70 dark:text-stone-100 dark:border-stone-700'
  }
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'red' ? AlertTriangle : UserRound

  if (!agent) {
    return (
      <div className={`rounded-2xl border p-4 ${styles.neutral}`}>
        <div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" />{title}</div>
        <p className="mt-2 text-sm opacity-80">{note || 'No agent found.'}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-75"><Icon className="h-4 w-4" />{title}</div>
          <h3 className="mt-1 font-serif text-xl font-bold">{agent.agentName}</h3>
        </div>
        <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-stone-800 dark:bg-stone-950/50 dark:text-stone-100">Row {agent.rowNumber}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><span className="font-bold">CS:</span> {agent.csScore ?? 'N/A'}%</div>
        <div><span className="font-bold">Group:</span> {agent.groupScore ?? 'N/A'}%</div>
        <div><span className="font-bold">Start:</span> {agent.startDate || 'N/A'}</div>
        <div><span className="font-bold">Supervisor:</span> {agent.supervisor || 'N/A'}</div>
      </div>
      <p className="mt-3 line-clamp-4 rounded-xl bg-white/55 p-3 text-sm dark:bg-stone-950/30">{agent.notes || agent.fullText || 'No notes.'}</p>
      <div className="mt-2 text-xs opacity-80">Source: {agent.sourceSheet}</div>
    </div>
  )
}
