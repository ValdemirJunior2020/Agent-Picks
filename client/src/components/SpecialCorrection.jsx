// client/src/components/SpecialCorrection.jsx
import { AlertTriangle, CalendarClock, ClipboardList, Gauge, UsersRound } from 'lucide-react'

function score(value) {
  return value == null ? 'N/A' : `${value}%`
}

export default function SpecialCorrection({ rows = [] }) {
  const agents = rows
    .filter((row) => row.specialCorrection)
    .sort((a, b) => {
      const aLowest = Math.min(a.csAverage ?? 101, a.groupAverage ?? 101)
      const bLowest = Math.min(b.csAverage ?? 101, b.groupAverage ?? 101)
      return aLowest - bLowest
    })

  return (
    <section className="rounded-[2rem] border border-rose-400 bg-rose-50/95 p-6 shadow-xl backdrop-blur-md dark:border-rose-800 dark:bg-rose-950/45">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4" />
            Special Correction Exposure
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black text-stone-900 dark:text-stone-50">
            Under 50 Average After 60 Phone Days
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-700 dark:text-stone-200">
            These agents have a CS or Groups average below 50 and have been on the phones for at least 60 days. They stay visible for focused correction and documented coaching.
          </p>
        </div>

        <div className="rounded-2xl bg-rose-900 px-4 py-3 text-sm font-black text-white shadow">
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
              className="rounded-[1.5rem] border border-rose-400 bg-white/90 p-5 text-rose-950 shadow-sm dark:border-rose-800 dark:bg-stone-900/75 dark:text-rose-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">
                    {agent.center}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-black">{agent.agentName}</h3>
                </div>

                <span className="rounded-full bg-rose-900 px-3 py-1 text-xs font-black text-white">
                  Special Correction
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span><strong>CS average:</strong> {score(agent.csAverage)}</span>
                </p>

                <p className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span><strong>Groups average:</strong> {score(agent.groupAverage)}</span>
                </p>

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

              <div className="mt-4 rounded-xl border border-rose-300 bg-rose-100 p-4 text-sm font-semibold leading-6 dark:border-rose-800 dark:bg-rose-950/45">
                The average is below 50 and the agent has at least two months of phone experience. Keep this agent exposed until correction is documented and the average improves.
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
