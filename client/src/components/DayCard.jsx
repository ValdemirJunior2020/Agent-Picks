// client/src/components/DayCard.jsx
import { Clipboard, FileDown, UsersRound } from 'lucide-react'
import AgentCard from './AgentCard'

function buildMeetingText(pick) {
  const m = pick.meeting
  if (pick.summaryOnly) {
    return `${m.dayName} ${m.time} - ${m.label}\nRisk summary: ${pick.riskyCount} agents need attention.\n` +
      pick.agents.map((a, i) => `${i + 1}. ${a.agentName} | ${a.center} | CS ${a.csScore ?? 'N/A'} | G ${a.groupScore ?? 'N/A'} | ${a.notes}`).join('\n')
  }
  const lines = [`${m.dayName} ${m.time} - ${m.label}`, `Total agents read: ${pick.centerRowsCount}`]
  if (pick.badCs) lines.push(`Bad CS Pick: ${pick.badCs.agentName} | CS ${pick.badCs.csScore ?? 'N/A'} | Row ${pick.badCs.rowNumber}`)
  if (pick.badGroup) lines.push(`Bad Group Pick: ${pick.badGroup.agentName} | G ${pick.badGroup.groupScore ?? 'N/A'} | Row ${pick.badGroup.rowNumber}`)
  if (m.csOnly) lines.push('Group Pick: TELUS is CS only')
  pick.goodAgents.forEach((a, i) => lines.push(`Good Pick ${i + 1}: ${a.agentName} | CS ${a.csScore ?? 'N/A'} | G ${a.groupScore ?? 'N/A'} | Row ${a.rowNumber}`))
  pick.notes.forEach((n) => lines.push(`Note: ${n}`))
  return lines.join('\n')
}

export default function DayCard({ pick }) {
  const copy = async () => navigator.clipboard.writeText(buildMeetingText(pick))
  const print = () => window.print()

  if (pick.summaryOnly) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 shadow-holy backdrop-blur dark:border-stone-700 dark:bg-stone-900/75">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">{pick.meeting.emoji} {pick.meeting.dayName} • {pick.meeting.time}</p>
            <h2 className="font-serif text-2xl font-black text-stone-900 dark:text-stone-50">{pick.meeting.label}</h2>
            <p className="text-stone-700 dark:text-stone-300">Summary only. {pick.riskyCount} agents currently need attention across all centers.</p>
          </div>
          <button onClick={copy} className="rounded-full bg-amber-800 px-4 py-2 text-sm font-bold text-white shadow hover:bg-amber-900"><Clipboard className="mr-2 inline h-4 w-4" />Copy Summary</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {pick.agents.map((agent) => <AgentCard key={agent.id} title={`${agent.center} Risk`} agent={agent} tone="red" />)}
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] border border-amber-200 bg-stone-50/90 p-5 shadow-holy backdrop-blur dark:border-stone-700 dark:bg-stone-900/75">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">{pick.meeting.emoji} {pick.meeting.dayName} • {pick.meeting.time}</p>
          <h2 className="font-serif text-2xl font-black text-stone-900 dark:text-stone-50">{pick.meeting.label}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300"><UsersRound className="h-4 w-4" /> {pick.centerRowsCount} agents found from Google Sheets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-800"><Clipboard className="mr-2 inline h-4 w-4" />Copy</button>
          <button onClick={print} className="rounded-full bg-rose-700 px-4 py-2 text-sm font-bold text-white shadow hover:bg-rose-800"><FileDown className="mr-2 inline h-4 w-4" />PDF</button>
        </div>
      </div>
      {pick.notes.length > 0 && <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-100/80 p-3 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">{pick.notes.join(' ')}</div>}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <AgentCard title="Bad CS Agent" agent={pick.badCs} tone="red" />
        {pick.meeting.csOnly ? <AgentCard title="Bad Group Agent" tone="neutral" note="TELUS is CS only." /> : <AgentCard title="Bad Group Agent" agent={pick.badGroup} tone="red" />}
        {pick.goodAgents.map((agent, index) => (
  <AgentCard
    key={`${agent.id}-${index}`}
    title={index === 0 ? 'Best Good CS Pick' : 'Best Good Group Pick'}
    agent={agent}
    tone="green"
  />
))}
      </div>
    </section>
  )
}
