// client/src/components/SpecialCorrection.jsx
import { AlertTriangle, CalendarClock, ClipboardList, Gauge, UsersRound } from 'lucide-react'

function score(value) {
  return value == null ? 'N/A' : `${value}%`
}

function scoreList(values = []) {
  return values.length ? values.map((value) => `${value}%`).join(', ') : 'N/A'
}

export default function SpecialCorrection({ rows = [] }) {
  const agents = rows
    .filter((row) => row.specialCorrection)
    .sort((a, b) => (a.lowestScore ?? 101) - (b.lowestScore ?? 101))

  return (
    <section
      id="special-correction"
      className="scroll-mt-28 rounded-[2rem] border border-yellow-500 bg-yellow-100/95 p-6 shadow-xl backdrop-blur-md dark:border-yellow-400 dark:bg-yellow-500/20"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-yellow-950 dark:text-yellow-100">
            <AlertTriangle className="h-4 w-4" />
            Special Correction Exposure
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black text-stone-900 dark:text-stone-50">
            Individual Review Below 50 After 60 Phone Days
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-700 dark:text-stone-200">
            These agents have at least one individual review below 50 and have been on the phones for at least 60 days. They stay visible for focused correction and documented coaching.
          </p>
        </div>

        <div className="qa-alert-badge rounded-2xl bg-yellow-950 px-4 py-3 text-sm font-black text-yellow-100 shadow">
          {agents.length} correction priorit{agents.length === 1 ? 'y' : 'ies'}
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-emerald-300 bg-emerald-50 p-5 font-semibold text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          No agent currently meets both special-correction conditions.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="qa-special-agent-card rounded-[1.5rem] border border-yellow-500 bg-white/90 p-5 text-yellow-950 shadow-sm dark:border-yellow-400 dark:bg-stone-900/85 dark:text-yellow-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-800 dark:text-yellow-200">
                    {agent.center}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-black">{agent.agentName}</h3>
                </div>

                <span className="rounded-full bg-yellow-950 px-3 py-1 text-xs font-black text-yellow-100">
                  Special Correction
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span><strong>Lowest review:</strong> {score(agent.lowestScore)}</span>
                </p>

                <p className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span><strong>Reviews under 50:</strong> {scoreList(agent.scoresUnder50)}</span>
                </p>

                <p className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span><strong>CS average:</strong> {score(agent.csAverage)}</span>
                </p>

                {agent.groupReviewCount > 0 && (
                  <p className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    <span><strong>Groups average:</strong> {score(agent.groupAverage)}</span>
                  </p>
                )}

                <p className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span><strong>Phone start:</strong> {agent.startDate}</span>
                </p>

                <p className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4" />
                  <span><strong>Days on phones:</strong> {agent.daysOnPhones}</span>
                </p>

                <p><strong>Total reviews:</strong> {agent.totalReviews}</p>
                <p><strong>Last reviewed:</strong> {agent.lastReviewLabel}</p>
              </div>

              <div className="mt-4 rounded-xl border border-yellow-500 bg-yellow-200/80 p-4 text-sm font-semibold leading-6 dark:border-yellow-400 dark:bg-yellow-500/20">
                At least one individual review is below 50 and this agent has at least two months of phone experience. Keep the agent exposed until correction is documented.
              </div>

              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                <div className="flex items-start gap-2">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Use the saved review history and call IDs when preparing the correction plan.</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}