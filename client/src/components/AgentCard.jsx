// client/src/components/AgentCard.jsx
import { AlertTriangle, CheckCircle2, Info, CalendarClock, Gauge } from 'lucide-react'

function scoreLabel(value) {
  return value == null ? 'N/A' : `${value}%`
}

function exposureBadgeClass(agent) {
  if (agent?.specialCorrection) {
    return 'bg-rose-800 text-white dark:bg-rose-700'
  }

  if (agent?.criticalUnder50) {
    return 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100'
  }

  if (agent?.belowKpi) {
    return 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100'
  }

  return 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100'
}

export default function AgentCard({ title, agent, tone = 'neutral', note }) {
  const styles = {
    red: {
      wrapper:
        'border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-100',
      icon: 'text-rose-700 dark:text-rose-300',
      badge: 'bg-white/80 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
      dateBox:
        'border-rose-200 bg-white/70 text-rose-950 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100',
    },
    green: {
      wrapper:
        'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100',
      icon: 'text-emerald-700 dark:text-emerald-300',
      badge: 'bg-white/80 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
      dateBox:
        'border-emerald-200 bg-white/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
    },
    neutral: {
      wrapper:
        'border-amber-300 bg-white/80 text-stone-800 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100',
      icon: 'text-stone-600 dark:text-stone-300',
      badge: 'bg-white/80 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
      dateBox:
        'border-amber-200 bg-white/70 text-stone-800 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-100',
    },
  }

  const selected = styles[tone] || styles.neutral
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'red' ? AlertTriangle : Info

  if (!agent) {
    return (
      <div className={`rounded-2xl border p-4 ${selected.wrapper}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${selected.icon}`} />
          <h4 className="font-black uppercase tracking-wide">{title}</h4>
        </div>

        <p className="mt-3 text-sm opacity-80">{note || 'No agent found.'}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border p-4 ${selected.wrapper}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${selected.icon}`} />
          <h4 className="font-black uppercase tracking-wide">{title}</h4>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-black ${selected.badge}`}>
          {agent.totalReviews} review{agent.totalReviews === 1 ? '' : 's'}
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-black">{agent.agentName}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${exposureBadgeClass(agent)}`}>
          {agent.exposureLabel}
        </span>

        {agent.specialCorrection && (
          <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-stone-950">
            Correction priority
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <strong>CS average:</strong> {scoreLabel(agent.csAverage)}
          {agent.csReviewCount > 0 ? ` (${agent.csReviewCount})` : ''}
        </p>

        <p>
          <strong>Groups average:</strong> {scoreLabel(agent.groupAverage)}
          {agent.groupReviewCount > 0 ? ` (${agent.groupReviewCount})` : ''}
        </p>

        <p>
          <strong>Phone start:</strong> {agent.startDate}
        </p>

        <p>
          <strong>Days on phones:</strong> {agent.daysOnPhones ?? 'N/A'}
        </p>
      </div>

      <div className={`mt-4 rounded-xl border p-3 text-sm ${selected.dateBox}`}>
        <div className="flex items-center gap-2 font-black">
          <CalendarClock className="h-4 w-4" />
          Review summary
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p>
            <strong>Last reviewed:</strong> {agent.lastReviewLabel}
          </p>

          <p>
            <strong>Latest call ID:</strong> {agent.latestCallId || 'N/A'}
          </p>

          <p>
            <strong>Call center:</strong> {agent.callCenters.join(', ') || agent.center}
          </p>

          <p>
            <strong>Latest evaluator:</strong> {agent.evaluator || 'N/A'}
          </p>
        </div>
      </div>

      {agent.specialCorrection && (
        <div className="mt-4 rounded-xl bg-rose-900 p-3 text-sm font-bold text-white">
          <div className="flex items-start gap-2">
            <Gauge className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Average under 50 and at least 60 days on the phones. This agent needs special exposure for correction.
            </span>
          </div>
        </div>
      )}

      {agent.notes && (
        <div className="mt-4 rounded-xl bg-white/55 p-3 text-sm dark:bg-stone-950/35">
          {agent.notes}
        </div>
      )}

      <p className="mt-3 text-xs opacity-75">Source: Agents Reviwed</p>
    </div>
  )
}
