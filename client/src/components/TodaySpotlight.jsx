// client/src/components/TodaySpotlight.jsx
import { Clipboard, Clock3, Sparkles, Star, FileDown } from 'lucide-react'
import DayCard from './DayCard'
import AgentCard from './AgentCard'

function buildSpotlightText(picks, nextMeeting) {
  const lines = []

  lines.push("Agent Picks - Today's Spotlight")
  lines.push(`Next Meeting: ${nextMeeting?.label || 'N/A'} at ${nextMeeting?.time || 'N/A'}`)
  lines.push('')

  picks.forEach((pick, index) => {
    lines.push(`${index + 1}. ${pick.meeting.label} | ${pick.meeting.dayName} ${pick.meeting.time}`)

    if (pick.badCs) {
      lines.push(
        `CS Below KPI: ${pick.badCs.agentName} | Average ${pick.badCs.csAverage ?? 'N/A'}% | ${pick.badCs.totalReviews} review(s)`
      )
    }

    if (pick.meeting.csOnly) {
      lines.push('Groups: TELUS is CS only')
    } else if (pick.badGroup) {
      lines.push(
        `Groups Below KPI: ${pick.badGroup.agentName} | Average ${pick.badGroup.groupAverage ?? 'N/A'}% | ${pick.badGroup.totalReviews} review(s)`
      )
    }

    if (pick.bestGoodCs) {
      lines.push(
        `Strong CS: ${pick.bestGoodCs.agentName} | Average ${pick.bestGoodCs.csAverage ?? 'N/A'}%`
      )
    }

    if (pick.bestGoodGroup) {
      lines.push(
        `Strong Groups: ${pick.bestGoodGroup.agentName} | Average ${pick.bestGoodGroup.groupAverage ?? 'N/A'}%`
      )
    }

    if (pick.notes?.length) {
      pick.notes.forEach((note) => lines.push(`Note: ${note}`))
    }

    lines.push('')
  })

  return lines.join('\n')
}

export default function TodaySpotlight({ picks = [], now = new Date(), nextMeeting }) {
  const copyAll = async () => {
    const text = buildSpotlightText(picks, nextMeeting)
    await navigator.clipboard.writeText(text)
  }

  const exportPdf = () => window.print()

  const headline =
    picks.length > 0
      ? `Special view for ${now.toLocaleDateString('en-US', { weekday: 'long' })}`
      : 'No meeting today — showing the next scheduled meeting'

  const primaryPick = picks[0]

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-stone-50/82 shadow-xl backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/76">
        <div className="bg-gradient-to-r from-amber-800 via-rose-800 to-emerald-800 p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-amber-100">
                <Sparkles className="h-4 w-4" />
                Today&apos;s Picks Spotlight
              </div>

              <h2 className="font-serif text-4xl font-black leading-tight">
                {headline}
              </h2>

              <p className="mt-2 max-w-3xl text-sm text-amber-50/90">
                A quick executive view for Barbara with the below-KPI averages, correction priorities, strong performers,
                and the next QA meeting focus.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyAll}
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-900 shadow hover:bg-amber-50"
              >
                <Clipboard className="mr-2 inline h-4 w-4" />
                Copy Today&apos;s Notes
              </button>

              <button
                onClick={exportPdf}
                className="rounded-full border border-white/60 px-4 py-2 text-sm font-black text-white hover:bg-white/10"
              >
                <FileDown className="mr-2 inline h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">
                Next meeting
              </div>
              <div className="mt-2 text-xl font-black">
                {nextMeeting?.label || 'N/A'}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-amber-50/90">
                <Clock3 className="h-4 w-4" />
                {nextMeeting?.dayName || nextMeeting?.day || 'N/A'} • {nextMeeting?.time || 'N/A'}
              </div>
            </div>

            <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">
                Meetings on screen
              </div>
              <div className="mt-2 text-3xl font-black">{picks.length}</div>
              <div className="mt-1 text-sm text-amber-50/90">
                Focused QA cards for the day
              </div>
            </div>

            <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">
                Main focus center
              </div>
              <div className="mt-2 text-2xl font-black">
                {primaryPick?.meeting?.center || nextMeeting?.center || 'N/A'}
              </div>
              <div className="mt-1 text-sm text-amber-50/90">
                Highlighted for today&apos;s attention
              </div>
            </div>
          </div>
        </div>

        {primaryPick ? (
          <div className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">
              <Star className="h-4 w-4" />
              Featured meeting
            </div>

            <div className="rounded-[1.75rem] border border-amber-200 bg-white/75 p-5 dark:border-stone-700 dark:bg-stone-950/45">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-200">
                  {primaryPick.meeting.emoji} {primaryPick.meeting.dayName} • {primaryPick.meeting.time}
                </p>

                <h3 className="font-serif text-3xl font-black text-stone-900 dark:text-stone-50">
                  {primaryPick.meeting.label}
                </h3>

                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {primaryPick.centerRowsCount ?? 0} unique agents calculated for this center.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <AgentCard title="CS Below-KPI Pick" agent={primaryPick.badCs} tone="red" />

                {primaryPick.meeting.csOnly ? (
                  <AgentCard title="Groups Below-KPI Pick" tone="neutral" note="TELUS is CS only." />
                ) : (
                  <AgentCard title="Groups Below-KPI Pick" agent={primaryPick.badGroup} tone="red" />
                )}

                {primaryPick.bestGoodCs ? (
                  <AgentCard title="Strong CS Example" agent={primaryPick.bestGoodCs} tone="green" />
                ) : (
                  <AgentCard title="Strong CS Example" tone="neutral" note="No CS average at or above 90% was found." />
                )}

                {primaryPick.meeting.csOnly ? (
                  <AgentCard title="Strong Groups Example" tone="neutral" note="TELUS is CS only." />
                ) : primaryPick.bestGoodGroup ? (
                  <AgentCard title="Strong Groups Example" agent={primaryPick.bestGoodGroup} tone="green" />
                ) : (
                  <AgentCard title="Strong Groups Example" tone="neutral" note="No Groups average at or above 85% was found." />
                )}
              </div>

              {primaryPick.notes?.length > 0 && (
                <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-100/80 p-4 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  {primaryPick.notes.join(' ')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-stone-600 dark:text-stone-300">
            No picks available yet.
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">
            📋 All cards in today&apos;s view
          </p>
          <h3 className="font-serif text-2xl font-black text-stone-900 dark:text-stone-50">
            Meeting breakdown
          </h3>
        </div>

        {picks.map((pick) => (
          <DayCard key={`${pick.meeting.dayName}-${pick.meeting.label}`} pick={pick} />
        ))}
      </section>
    </div>
  )
}