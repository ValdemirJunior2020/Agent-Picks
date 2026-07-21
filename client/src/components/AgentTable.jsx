// client/src/components/AgentTable.jsx
import { Search } from 'lucide-react'
import { filterRows } from '../lib/picker'

function score(value) {
  return value == null ? 'N/A' : `${value}%`
}

function rowClass(row) {
  if (row.specialCorrection) return 'bg-rose-200/90 dark:bg-rose-950/65'
  if (row.criticalUnder50) return 'bg-rose-50/90 dark:bg-rose-950/30'
  if (row.belowKpi) return 'bg-amber-50/90 dark:bg-amber-950/20'
  return 'bg-emerald-50/70 dark:bg-emerald-950/20'
}

export default function AgentTable({ rows, filters, setFilters }) {
  const centers = ['ALL', ...Array.from(new Set(rows.map((row) => row.center).filter(Boolean))).sort()]
  const filtered = filterRows(rows, filters)

  return (
    <section id="agent-dashboard" className="scroll-mt-28 rounded-[2rem] border border-amber-200 bg-stone-50/90 p-5 shadow-holy backdrop-blur dark:border-stone-700 dark:bg-stone-900/75">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">
            🧾 Agent averages
          </p>
          <h2 className="font-serif text-2xl font-black text-stone-900 dark:text-stone-50">
            Agents Reviwed Dashboard
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Showing {filtered.length} of {rows.length} unique agents.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Search agent or call ID..."
              className="w-full rounded-2xl border border-amber-200 bg-white/90 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-600 dark:border-stone-700 dark:bg-stone-950"
            />
          </label>

          <select
            value={filters.center}
            onChange={(event) => setFilters({ ...filters, center: event.target.value })}
            className="rounded-2xl border border-amber-200 bg-white/90 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950"
          >
            {centers.map((center) => (
              <option key={center}>{center}</option>
            ))}
          </select>

          <select
            value={filters.performance}
            onChange={(event) => setFilters({ ...filters, performance: event.target.value })}
            className="rounded-2xl border border-amber-200 bg-white/90 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950"
          >
            <option value="ALL">All agents</option>
            <option value="BELOW_KPI">All below KPI</option>
            <option value="BAD_CS">CS average below 90</option>
            <option value="BAD_GROUP">Groups average below 85</option>
            <option value="UNDER_50">Any individual review under 50</option>
            <option value="SPECIAL">Special correction</option>
            <option value="PASSING">Meeting KPI</option>
          </select>
        </div>
      </div>

      <div className="mt-5 max-h-[650px] overflow-auto rounded-2xl border border-amber-200 dark:border-stone-700">
        <table className="min-w-full divide-y divide-amber-200 text-left text-sm dark:divide-stone-700">
          <thead className="sticky top-0 bg-amber-100 text-amber-950 dark:bg-stone-950 dark:text-stone-100">
            <tr>
              {[
                'Center',
                'Agent',
                'Phone Start',
                'Phone Days',
                'CS Average',
                'Groups Average',
                'Reviews',
                'Last Reviewed',
                'Exposure',
              ].map((header) => (
                <th key={header} className="whitespace-nowrap px-3 py-3 font-black">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
            {filtered.map((row) => (
              <tr key={row.id} className={rowClass(row)}>
                <td className="whitespace-nowrap px-3 py-3 font-bold">{row.center}</td>
                <td className="min-w-52 px-3 py-3 font-bold">{row.agentName}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.startDate}</td>
                <td className="px-3 py-3 font-bold">{row.daysOnPhones ?? 'N/A'}</td>
                <td className="px-3 py-3 font-bold">{score(row.csAverage)}</td>
                <td className="px-3 py-3 font-bold">{score(row.groupAverage)}</td>
                <td className="px-3 py-3">{row.totalReviews}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.lastReviewLabel}</td>
                <td className="min-w-52 px-3 py-3 font-bold">{row.exposureLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}