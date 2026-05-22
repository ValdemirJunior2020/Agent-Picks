// client/src/components/UnderProbation.jsx
import { AlertTriangle, CalendarClock, UserRoundCheck, ClipboardList } from 'lucide-react'

const probationAgents = [
  {
    id: 'tep-melanie-buala',
    name: 'Melanie Buala',
    center: 'TEP',
    supervisor: 'Tobias, Alejandro C',
    watchStartDate: '05/22/2026',
    reviewWindow: '2 to 3 weeks',
    status: 'Under Probation / Performance Watch',
    notes:
      'Needs close attention starting 05/22/2026. Watch QA performance, coaching progress, and call handling closely during the next 2 to 3 weeks.',
  },
  {
    id: 'tep-tobias-alejandro-c',
    name: 'Tobias, Alejandro C',
    center: 'TEP',
    supervisor: 'N/A',
    watchStartDate: '05/22/2026',
    reviewWindow: '2 to 3 weeks',
    status: 'Under Probation / Performance Watch',
    notes:
      'Needs close attention starting 05/22/2026. Watch QA performance, coaching progress, and call handling closely during the next 2 to 3 weeks.',
  },
]

export default function UnderProbation() {
  return (
    <section className="rounded-[2rem] border border-rose-300 bg-rose-50/90 p-6 shadow-xl backdrop-blur-md dark:border-rose-800 dark:bg-rose-950/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4" />
            Under Probation / Performance Watch
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black text-stone-900 dark:text-stone-50">
            TEP Agents Requiring Close Attention
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-700 dark:text-stone-200">
            These agents are being watched separately from the normal QA rotation.
            The goal is to track improvement, coaching progress, and performance over the next 2 to 3 weeks.
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-black text-rose-900 shadow dark:bg-stone-900 dark:text-rose-100">
          {probationAgents.length} active watch item(s)
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {probationAgents.map((agent) => (
          <article
            key={agent.id}
            className="rounded-[1.5rem] border border-rose-300 bg-white/80 p-5 text-rose-950 shadow-sm dark:border-rose-800 dark:bg-stone-900/70 dark:text-rose-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">
                  {agent.center}
                </p>

                <h3 className="mt-1 font-serif text-2xl font-black">
                  {agent.name}
                </h3>
              </div>

              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-900 dark:bg-rose-950 dark:text-rose-100">
                Watch
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <strong>Call Center:</strong> {agent.center}
              </p>

              <p>
                <strong>Supervisor/TL:</strong> {agent.supervisor}
              </p>

              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  <strong>Start Watching:</strong> {agent.watchStartDate}
                </span>
              </p>

              <p className="flex items-center gap-2">
                <UserRoundCheck className="h-4 w-4" />
                <span>
                  <strong>Review Window:</strong> {agent.reviewWindow}
                </span>
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 dark:border-rose-800 dark:bg-rose-950/40">
              {agent.notes}
            </div>

            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Suggested action: review progress weekly and document coaching notes before making any final decision.
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}