// client/src/components/DayCard.jsx
import { Clipboard, CalendarDays, FileDown } from 'lucide-react'
import AgentCard from './AgentCard'

function buildAgentCopyLine(agent) {
  return [
    agent?.agentName || 'N/A',
    agent?.center || 'N/A',
    agent?.startDate || 'N/A',
    `CS Avg: ${agent?.csAverage ?? 'N/A'}`,
    `Groups Avg: ${agent?.groupAverage ?? 'N/A'}`,
    `Reviews: ${agent?.totalReviews ?? 0}`,
    agent?.specialCorrection ? 'SPECIAL CORRECTION' : agent?.exposureLabel || '',
  ].join('\t')
}

function buildCopyText(pick) {
  const selectedAgents = [
    pick?.badCs,
    pick?.meeting?.csOnly ? null : pick?.badGroup,
  ].filter(Boolean)

  const uniqueAgents = []
  const seen = new Set()

  selectedAgents.forEach((agent) => {
    if (!seen.has(agent.id)) {
      seen.add(agent.id)
      uniqueAgents.push(agent)
    }
  })

  const lines = [
    'Here are the QA choices for this meeting.',
    '',
    'Please provide the past three QA scores and call IDs for each selected agent when available.',
    '',
    `${pick.meeting.label}:`,
  ]

  if (!uniqueAgents.length) {
    lines.push('No below-KPI CS or Groups choice was found.')
    return lines.join('\n')
  }

  uniqueAgents.forEach((agent) => lines.push(buildAgentCopyLine(agent)))
  return lines.join('\n')
}

export default function DayCard({ pick }) {
  if (!pick?.meeting) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCopyText(pick))
  }

  const handlePdf = () => window.print()

  return (
    <section className="rounded-[2rem] border border-amber-200 bg-stone-50/84 p-5 shadow-xl backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/72">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">
            <CalendarDays className="h-4 w-4" />
            {pick.meeting.dayName} • {pick.meeting.time}
          </p>

          <h2 className="font-serif text-3xl font-black text-stone-900 dark:text-stone-50">
            {pick.meeting.label}
          </h2>

          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            {pick.centerRowsCount ?? 0} unique agents calculated from the Agents Reviwed tab
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow hover:bg-emerald-800"
          >
            <Clipboard className="mr-2 inline h-4 w-4" />
            Copy
          </button>

          <button
            onClick={handlePdf}
            className="rounded-full bg-rose-700 px-4 py-2 text-sm font-black text-white shadow hover:bg-rose-800"
          >
            <FileDown className="mr-2 inline h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <AgentCard
          title="CS Below-KPI Pick"
          agent={pick.badCs}
          tone="red"
          note="No CS average below 90% was found."
        />

        {pick.meeting.csOnly ? (
          <AgentCard title="Groups Below-KPI Pick" tone="neutral" note="TELUS is CS only." />
        ) : (
          <AgentCard
            title="Groups Below-KPI Pick"
            agent={pick.badGroup}
            tone="red"
            note="No Groups average below 85% was found."
          />
        )}

        <AgentCard
          title="Strong CS Example"
          agent={pick.bestGoodCs}
          tone="green"
          note="No CS average at or above 90% was found."
        />

        {pick.meeting.csOnly ? (
          <AgentCard title="Strong Groups Example" tone="neutral" note="TELUS is CS only." />
        ) : (
          <AgentCard
            title="Strong Groups Example"
            agent={pick.bestGoodGroup}
            tone="green"
            note="No Groups average at or above 85% was found."
          />
        )}
      </div>

      {pick.notes?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-100/80 p-4 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {pick.notes.join(' ')}
        </div>
      )}
    </section>
  )
}
