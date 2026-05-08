// client/src/components/AgentTable.jsx
import { Search } from 'lucide-react'
import { filterRows } from '../lib/picker'

export default function AgentTable({ rows, filters, setFilters }) {
  const supervisors = ['ALL', ...Array.from(new Set(rows.map((r) => r.supervisor).filter(Boolean))).sort()]
  const centers = ['ALL', ...Array.from(new Set(rows.map((r) => r.center).filter(Boolean))).sort()]
  const filtered = filterRows(rows, filters)
  return (
    <section className="rounded-[2rem] border border-amber-200 bg-stone-50/90 p-5 shadow-holy backdrop-blur dark:border-stone-700 dark:bg-stone-900/75">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">🧾 All Agents</p>
          <h2 className="font-serif text-2xl font-black text-stone-900 dark:text-stone-50">Searchable QA Sheet Table</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">Showing {filtered.length} of {rows.length} rows.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search agent, notes..." className="w-full rounded-2xl border border-amber-200 bg-white/90 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-600 dark:border-stone-700 dark:bg-stone-950" />
          </label>
          <select value={filters.center} onChange={(e) => setFilters({ ...filters, center: e.target.value })} className="rounded-2xl border border-amber-200 bg-white/90 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950">{centers.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={filters.supervisor} onChange={(e) => setFilters({ ...filters, supervisor: e.target.value })} className="rounded-2xl border border-amber-200 bg-white/90 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950">{supervisors.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={filters.performance} onChange={(e) => setFilters({ ...filters, performance: e.target.value })} className="rounded-2xl border border-amber-200 bg-white/90 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950">
            <option value="ALL">All Performance</option>
            <option value="BAD_CS">Bad CS &lt; 90</option>
            <option value="BAD_GROUP">Bad Group &lt; 85</option>
            <option value="GOOD">Good Agents</option>
          </select>
        </div>
      </div>
      <div className="mt-5 max-h-[620px] overflow-auto rounded-2xl border border-amber-200 dark:border-stone-700">
        <table className="min-w-full divide-y divide-amber-200 text-left text-sm dark:divide-stone-700">
          <thead className="sticky top-0 bg-amber-100 text-amber-950 dark:bg-stone-950 dark:text-stone-100">
            <tr>
              {['Center', 'Agent', 'Start', 'Supervisor', 'CS', 'Group', 'Sheet', 'Row', 'Notes / Comments'].map((h) => <th key={h} className="px-3 py-3 font-black">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 bg-white/70 dark:divide-stone-800 dark:bg-stone-900/60">
            {filtered.map((row) => {
              const bad = (row.csScore != null && row.csScore < 90) || (row.groupScore != null && row.groupScore < 85) || row.riskWords
              const good = !bad && ((row.csScore != null && row.csScore >= 90) || (row.groupScore != null && row.groupScore >= 85))
              return (
                <tr key={row.id} className={bad ? 'bg-rose-50/80 dark:bg-rose-950/25' : good ? 'bg-emerald-50/80 dark:bg-emerald-950/25' : ''}>
                  <td className="px-3 py-3 font-bold">{row.center}</td>
                  <td className="px-3 py-3 font-bold">{row.agentName}</td>
                  <td className="px-3 py-3">{row.startDate}</td>
                  <td className="px-3 py-3">{row.supervisor}</td>
                  <td className="px-3 py-3 font-bold">{row.csScore ?? 'N/A'}</td>
                  <td className="px-3 py-3 font-bold">{row.groupScore ?? 'N/A'}</td>
                  <td className="px-3 py-3">{row.sourceSheet}</td>
                  <td className="px-3 py-3">{row.rowNumber}</td>
                  <td className="max-w-lg px-3 py-3">{row.notes || row.fullText}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
