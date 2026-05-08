// client/src/components/AgentCard.jsx
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

function cleanTitle(title = '') {
  return String(title)
    .replaceAll('BAD CS AGENT', 'CS REVIEW PICK')
    .replaceAll('BAD GROUP AGENT', 'GROUP REVIEW PICK')
    .replaceAll('BAD AGENT', 'REVIEW PICK')
    .replaceAll('BAD CS PICK', 'CS REVIEW PICK')
    .replaceAll('BAD GROUP PICK', 'GROUP REVIEW PICK')
    .replaceAll('MAIN BAD CS PICK', 'MAIN CS REVIEW PICK')
    .replaceAll('MAIN BAD GROUP PICK', 'MAIN GROUP REVIEW PICK')
    .replaceAll('BEST GOOD CS PICK', 'STRONG CS EXAMPLE')
    .replaceAll('BEST GOOD GROUP PICK', 'STRONG GROUP EXAMPLE')
    .replaceAll('Best Good CS Pick', 'Strong CS Example')
    .replaceAll('Best Good Group Pick', 'Strong Group Example')
    .replaceAll('Main Bad CS Pick', 'Main CS Review Pick')
    .replaceAll('Main Bad Group Pick', 'Main Group Review Pick')
    .replaceAll('Bad CS Agent', 'CS Review Pick')
    .replaceAll('Bad Group Agent', 'Group Review Pick')
    .replaceAll('Bad Agent', 'Review Pick')
    .replaceAll('bad', 'review')
    .replaceAll('Bad', 'Review')
    .replaceAll('BAD', 'REVIEW')
}

export default function AgentCard({ title, agent, tone = 'neutral', note }) {
  const styles = {
    red: {
      wrapper:
        'border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-100',
      icon: 'text-rose-700 dark:text-rose-300',
      badge: 'bg-white/80 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
    },
    green: {
      wrapper:
        'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100',
      icon: 'text-emerald-700 dark:text-emerald-300',
      badge: 'bg-white/80 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    },
    neutral: {
      wrapper:
        'border-amber-300 bg-white/80 text-stone-800 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100',
      icon: 'text-stone-600 dark:text-stone-300',
      badge: 'bg-white/80 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
    },
  }

  const selected = styles[tone] || styles.neutral
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'red' ? AlertTriangle : Info
  const safeTitle = cleanTitle(title)

  if (!agent) {
    return (
      <div className={`rounded-2xl border p-4 ${selected.wrapper}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${selected.icon}`} />
          <h4 className="font-black uppercase tracking-wide">{safeTitle}</h4>
        </div>

        <p className="mt-3 text-sm opacity-80">
          {note || 'No review pick found.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border p-4 ${selected.wrapper}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${selected.icon}`} />
          <h4 className="font-black uppercase tracking-wide">{safeTitle}</h4>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-black ${selected.badge}`}>
          Row {agent.rowNumber || 'N/A'}
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-black">
        {agent.agentName || 'Unknown Agent'}
      </h3>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <strong>CS:</strong> {agent.csScore ?? 'N/A'}{agent.csScore != null ? '%' : ''}
        </p>

        <p>
          <strong>Group:</strong> {agent.groupScore ?? 'N/A'}{agent.groupScore != null ? '%' : ''}
        </p>

        <p>
          <strong>Start:</strong> {agent.startDate || 'N/A'}
        </p>

        <p>
          <strong>Supervisor:</strong> {agent.supervisor || 'N/A'}
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-white/55 p-3 text-sm dark:bg-stone-950/35">
        {agent.notes || agent.fullText || 'No notes available.'}
      </div>

      <p className="mt-3 text-xs opacity-75">
        Source: {agent.sourceSheet || agent.sheetName || 'N/A'}
      </p>
    </div>
  )
}