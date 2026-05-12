// client/src/components/DayCard.jsx
import { Clipboard, CalendarDays, FileDown } from 'lucide-react'
import AgentCard from './AgentCard'

function getPickValue(pick, primary, fallback) {
  return pick?.[primary] || pick?.[fallback] || null
}

function cleanNoteText(text = '') {
  return String(text)
    .replaceAll('bad CS', 'CS review')
    .replaceAll('bad Group', 'Group review')
    .replaceAll('bad agent', 'review pick')
    .replaceAll('Bad CS', 'CS Review')
    .replaceAll('Bad Group', 'Group Review')
    .replaceAll('Bad Agent', 'Review Pick')
    .replaceAll('BAD CS', 'CS REVIEW')
    .replaceAll('BAD GROUP', 'GROUP REVIEW')
    .replaceAll('BAD AGENT', 'REVIEW PICK')
    .replaceAll('bad', 'review')
    .replaceAll('Bad', 'Review')
    .replaceAll('BAD', 'REVIEW')
}

<<<<<<< HEAD
function buildCopyText(pick) {
  const csReview = getPickValue(pick, 'badCs', 'badCsAgent')
  const groupReview = getPickValue(pick, 'badGroup', 'badGroupAgent')
  const strongCs = pick?.bestGoodCs || pick?.goodAgents?.[0] || null
  const strongGroup = pick?.bestGoodGroup || pick?.goodAgents?.[1] || null

  const lines = []

  lines.push(`Agent Picks - ${pick.meeting.label}`)
  lines.push(`${pick.meeting.dayName} @ ${pick.meeting.time}`)
  lines.push('')
  lines.push('Important: This tool identifies QA records for review. It does not label agents as bad.')
  lines.push('A low score may reflect one specific call issue, not the agent’s overall performance.')
  lines.push('')
  lines.push(`CS Review Pick: ${csReview?.agentName || 'Not found'}`)
  lines.push(
    `Group Review Pick: ${
      pick.meeting.csOnly ? 'TELUS is CS only' : groupReview?.agentName || 'Not found'
    }`
  )
  lines.push(`Strong CS Example: ${strongCs?.agentName || 'Not found'}`)
  lines.push(
    `Strong Group Example: ${
      pick.meeting.csOnly ? 'TELUS is CS only' : strongGroup?.agentName || 'Not found'
    }`
  )

  if (pick.notes?.length) {
    lines.push('')
    lines.push('Notes:')
    pick.notes.forEach((note) => lines.push(`- ${cleanNoteText(note)}`))
  }

=======
function buildAgentCopyLine(agent) {
  return [
    agent?.agentName || 'N/A',
    agent?.startDate || 'N/A',
    agent?.supervisor || 'N/A',
  ].join('\t')
}

function buildCopyText(pick) {
  const csReview = getPickValue(pick, 'badCs', 'badCsAgent')
  const groupReview = getPickValue(pick, 'badGroup', 'badGroupAgent')

  const selectedAgents = [
    csReview,
    pick?.meeting?.csOnly ? null : groupReview,
  ].filter(Boolean)

  const uniqueAgents = []
  const seen = new Set()

  selectedAgents.forEach((agent) => {
    const key = agent?.id || `${agent?.agentName}-${agent?.startDate}-${agent?.supervisor}`

    if (!seen.has(key)) {
      seen.add(key)
      uniqueAgents.push(agent)
    }
  })

  const lines = ['Groups and CS Choices for the Day:']

  if (!uniqueAgents.length) {
    lines.push('No CS or Group choice found.')
    return lines.join('\n')
  }

  uniqueAgents.forEach((agent) => {
    lines.push(buildAgentCopyLine(agent))
  })

>>>>>>> 774db9c (Update project files)
  return lines.join('\n')
}

export default function DayCard({ pick }) {
  if (!pick?.meeting) return null

  const csReview = getPickValue(pick, 'badCs', 'badCsAgent')
  const groupReview = getPickValue(pick, 'badGroup', 'badGroupAgent')
  const strongCs = pick.bestGoodCs || pick.goodAgents?.[0] || null
  const strongGroup = pick.bestGoodGroup || pick.goodAgents?.[1] || null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCopyText(pick))
  }

  const handlePdf = () => {
    window.print()
  }

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
            {pick.centerRowsCount ?? pick.agentsCount ?? 0} records found from Google Sheets
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
          title="CS Review Pick"
          agent={csReview}
          tone="red"
          note="No CS review pick found."
        />

        {pick.meeting.csOnly ? (
          <AgentCard
            title="Group Review Pick"
            tone="neutral"
            note="TELUS is CS only."
          />
        ) : (
          <AgentCard
            title="Group Review Pick"
            agent={groupReview}
            tone="red"
            note="No Group review pick found."
          />
        )}

        <AgentCard
          title="Strong CS Example"
          agent={strongCs}
          tone="green"
          note="No strong CS example found."
        />

        {pick.meeting.csOnly ? (
          <AgentCard
            title="Strong Group Example"
            tone="neutral"
            note="TELUS is CS only."
          />
        ) : (
          <AgentCard
            title="Strong Group Example"
            agent={strongGroup}
            tone="green"
            note="No strong Group example found."
          />
        )}
      </div>

      {pick.notes?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-100/80 p-4 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {cleanNoteText(pick.notes.join(' '))}
        </div>
      )}
    </section>
  )
}