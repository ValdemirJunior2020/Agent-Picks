// client/src/App.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Cross,
  Moon,
  RefreshCcw,
  Settings,
  ShieldAlert,
  Sun,
  Table2,
  Target,
  UsersRound,
  Wheat,
} from 'lucide-react'
import { fetchAgentRows } from './lib/api'
import {
  formatCountdown,
  getNextMeeting,
  getNextPickGroup,
  todayLabel,
} from './lib/schedule'
import { generatePicks, normalizeRows } from './lib/picker'
import DayCard from './components/DayCard'
import AgentTable from './components/AgentTable'
import TodaySpotlight from './components/TodaySpotlight'
import NextPickWarning from './components/NextPickWarning'
import SmileOfTheDay from './components/SmileOfTheDay'
import SpecialCorrection from './components/SpecialCorrection'

const QA_DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']
const emptyPayload = { success: true, reviews: [] }

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  names = [],
  alert = false,
  onClick,
}) {
  const hasAlert = alert && Number(value) > 0
  const Wrapper = onClick ? 'button' : 'div'
  const visibleNames = names.slice(0, 3)
  const hiddenCount = Math.max(0, names.length - visibleNames.length)

  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`w-full rounded-[1.5rem] border p-4 text-left shadow-sm backdrop-blur-md transition ${
        hasAlert
          ? 'qa-alert-card border-yellow-500 bg-yellow-200/95 text-yellow-950 dark:border-yellow-400 dark:bg-yellow-500/25 dark:text-yellow-50'
          : 'border-amber-200 bg-white/72 dark:border-stone-700 dark:bg-stone-900/72'
      } ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-300/70' : ''}`}
      aria-label={onClick ? `${label}: ${value}. Open matching agents.` : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`rounded-2xl p-3 ${
            hasAlert
              ? 'bg-yellow-600 text-white shadow-md'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {hasAlert ? (
          <span className="rounded-full bg-yellow-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-100">
            Click to view
          </span>
        ) : (
          <span className="text-2xl">✝️</span>
        )}
      </div>

      <div className={`mt-3 text-sm font-black uppercase tracking-widest ${hasAlert ? 'text-yellow-950 dark:text-yellow-100' : 'text-stone-500 dark:text-stone-400'}`}>
        {label}
      </div>

      <div className={`font-serif text-3xl font-black ${hasAlert ? 'text-yellow-950 dark:text-white' : 'text-stone-900 dark:text-stone-50'}`}>
        {value}
      </div>

      <div className={`text-sm font-semibold ${hasAlert ? 'text-yellow-900 dark:text-yellow-100' : 'text-stone-600 dark:text-stone-300'}`}>
        {sub}
      </div>

      {hasAlert && visibleNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleNames.map((name) => (
            <span
              key={name}
              className="rounded-full border border-yellow-700/40 bg-white/75 px-2.5 py-1 text-xs font-black text-yellow-950 shadow-sm dark:bg-yellow-950/45 dark:text-yellow-50"
            >
              {name}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="rounded-full bg-yellow-950 px-2.5 py-1 text-xs font-black text-yellow-100">
              +{hiddenCount} more
            </span>
          )}
        </div>
      )}
    </Wrapper>
  )
}

function timeToMinutes(timeString = '') {
  const match = String(timeString).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0

  let hour = Number(match[1])
  const minute = Number(match[2])
  const ampm = match[3].toUpperCase()

  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0

  return hour * 60 + minute
}

function getDayPriority(dayName, currentDayName) {
  const currentIndex = QA_DAYS.indexOf(currentDayName)
  const dayIndex = QA_DAYS.indexOf(dayName)

  if (dayIndex === -1) return 999
  if (currentIndex === -1) return dayIndex

  return (dayIndex - currentIndex + QA_DAYS.length) % QA_DAYS.length
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dark, setDark] = useState(false)
  const [payload, setPayload] = useState(emptyPayload)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    center: 'ALL',
    performance: 'ALL',
  })
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const rows = useMemo(() => normalizeRows(payload, now), [payload, now])
  const picks = useMemo(() => generatePicks(rows), [rows])
  const nextMeeting = getNextMeeting(now)
  const nextPickGroup = getNextPickGroup(now)

  const qaPicks = useMemo(
    () => picks.filter((pick) => pick.meeting.autoPick === true),
    [picks]
  )

  const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' })

  const orderedQaPicks = useMemo(() => {
    return [...qaPicks].sort((a, b) => {
      const aDayPriority = getDayPriority(a?.meeting?.dayName || '', currentDayName)
      const bDayPriority = getDayPriority(b?.meeting?.dayName || '', currentDayName)

      if (aDayPriority !== bDayPriority) return aDayPriority - bDayPriority
      return timeToMinutes(a?.meeting?.time || '') - timeToMinutes(b?.meeting?.time || '')
    })
  }, [qaPicks, currentDayName])

  const todaysPicks = useMemo(() => {
    const todaysRealQaMeetings = qaPicks.filter(
      (pick) => pick.meeting.dayName === currentDayName
    )

    if (todaysRealQaMeetings.length > 0) return todaysRealQaMeetings

    if (nextPickGroup?.meetings?.length) {
      const nextLabels = nextPickGroup.meetings.map((meeting) => meeting.label)
      const nextGroupPicks = qaPicks.filter((pick) => nextLabels.includes(pick.meeting.label))
      if (nextGroupPicks.length > 0) return nextGroupPicks
    }

    if (!nextMeeting) return []

    const fallback = qaPicks.find(
      (pick) =>
        pick.meeting.center === nextMeeting.center &&
        pick.meeting.label === nextMeeting.label
    )

    return fallback ? [fallback] : []
  }, [qaPicks, currentDayName, nextPickGroup, nextMeeting])

  const csBelowKpi = rows.filter((row) => row.csBelowKpi).length
  const groupsBelowKpi = rows.filter((row) => row.groupBelowKpi).length
  const under50Agents = rows
    .filter((row) => row.criticalUnder50)
    .sort((a, b) => (a.lowestScore ?? 101) - (b.lowestScore ?? 101))
  const specialCorrectionAgents = rows
    .filter((row) => row.specialCorrection)
    .sort((a, b) => (a.lowestScore ?? 101) - (b.lowestScore ?? 101))
  const under50 = under50Agents.length
  const specialCorrection = specialCorrectionAgents.length
  const hasGroupReviews = rows.some((row) => row.groupReviewCount > 0)

  function openUnder50Agents() {
    setFilters({ search: '', center: 'ALL', performance: 'UNDER_50' })
    setActiveTab('agents')

    window.setTimeout(() => {
      document.getElementById('agent-dashboard')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  function openSpecialCorrection() {
    setActiveTab('special')

    window.setTimeout(() => {
      document.getElementById('special-correction')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  async function loadLive() {
    setLoading(true)
    setError('')

    try {
      const data = await fetchAgentRows()
      setPayload(data)
      setLastUpdated(new Date())
    } catch (requestError) {
      setError(requestError.message)
      setPayload(emptyPayload)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLive()
  }, [])

  const tabs = [
    { id: 'overview', label: 'Whole Week Picks', icon: CalendarDays },
    { id: 'daily', label: "Today's Picks", icon: Wheat },
    { id: 'special', label: 'Special Correction', icon: ShieldAlert },
    { id: 'agents', label: 'All Agents', icon: Table2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div
      className="min-h-screen bg-stone-100 bg-cover bg-fixed bg-center text-stone-900 dark:bg-stone-950 dark:text-stone-50"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,251,235,.66), rgba(255,247,237,.42), rgba(236,253,245,.32)), url("/bg.png")',
      }}
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(159,18,57,.10),transparent_40%)] dark:bg-[linear-gradient(90deg,rgba(28,25,23,.88),rgba(41,37,36,.72))]">
        <header className="sticky top-0 z-40 border-b border-amber-200/80 bg-stone-50/74 backdrop-blur-xl dark:border-stone-700 dark:bg-stone-950/72">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-rose-800 text-white shadow-lg">
                <Cross className="h-7 w-7" />
              </div>

              <div>
                <h1 className="font-serif text-3xl font-black leading-none">Agent Picks</h1>
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  Weekly QA picks based only on averages from the Agents Reviwed tab.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-bold dark:border-stone-700 dark:bg-stone-900">
                {todayLabel(now)}
              </div>

              {nextMeeting && (
                <div className="rounded-full bg-amber-800 px-4 py-2 text-sm font-bold text-white">
                  Next: {nextMeeting.label} in {formatCountdown(nextMeeting.date, now)}
                </div>
              )}

              <button
                onClick={() => setDark(!dark)}
                className="rounded-full border border-amber-200 bg-white/80 p-2 dark:border-stone-700 dark:bg-stone-900"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-[2rem] border border-amber-200 bg-stone-50/76 p-3 shadow-xl backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/72">
            <div className="mb-3 rounded-[1.5rem] bg-gradient-to-br from-amber-800 to-rose-800 p-4 text-white">
              <div className="text-2xl">🕊️</div>
              <p className="font-serif text-xl font-black">Average-Based QA</p>
              <p className="text-sm opacity-90">CS KPI 90% • Groups KPI 85%</p>
            </div>

            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === id
                      ? id === 'special'
                        ? 'bg-rose-800 text-white shadow'
                        : 'bg-amber-800 text-white shadow'
                      : 'hover:bg-amber-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>

            <button
              onClick={loadLive}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white shadow hover:bg-emerald-800 disabled:opacity-60"
            >
              <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Picks
            </button>
          </aside>

          <section className="space-y-5">
            <SmileOfTheDay />
            <NextPickWarning nextPickGroup={nextPickGroup} />

            <div className="rounded-[1.5rem] border border-emerald-300 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-950 shadow-sm backdrop-blur dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              Each agent appears once. CS exposure uses the agent's average across saved reviews. Any individual review below 50 is marked Critical. A review below 50 plus at least 60 phone days triggers Special Correction.
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/88 p-4 font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100">
                The live Google Sheet could not be loaded: {error}. No old-source or demo agents are being shown.
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-amber-300 bg-amber-100/90 p-4 font-bold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                Reading Agents Reviwed, calculating averages, and preparing the weekly picks...
              </div>
            )}

            {activeTab === 'daily' && (
              <TodaySpotlight picks={todaysPicks} now={now} nextMeeting={nextMeeting} />
            )}

            {activeTab === 'special' && <SpecialCorrection rows={rows} />}

            {activeTab === 'overview' && (
              <>
                <div className={`grid gap-4 md:grid-cols-2 ${hasGroupReviews ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                  <Stat
                    icon={UsersRound}
                    label="Unique Agents"
                    value={rows.length}
                    sub={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for live data'}
                  />

                  <Stat
                    icon={Target}
                    label="CS Below KPI"
                    value={csBelowKpi}
                    sub="Average below 90%"
                  />

                  {hasGroupReviews && (
                    <Stat
                      icon={CalendarDays}
                      label="Groups Below KPI"
                      value={groupsBelowKpi}
                      sub="Average below 85%"
                    />
                  )}

                  <Stat
                    icon={AlertTriangle}
                    label="Under 50"
                    value={under50}
                    sub="Any individual review below 50"
                    names={under50Agents.map((agent) => agent.agentName)}
                    alert={under50 > 0}
                    onClick={under50 > 0 ? openUnder50Agents : undefined}
                  />

                  <Stat
                    icon={ShieldAlert}
                    label="Special Correction"
                    value={specialCorrection}
                    sub="Review below 50 + 60 phone days"
                    names={specialCorrectionAgents.map((agent) => agent.agentName)}
                    alert={specialCorrection > 0}
                    onClick={specialCorrection > 0 ? openSpecialCorrection : undefined}
                  />
                </div>

                <div className="grid gap-5">
                  {orderedQaPicks.map((pick) => (
                    <DayCard key={`${pick.meeting.dayName}-${pick.meeting.label}`} pick={pick} />
                  ))}
                </div>
              </>
            )}

            {activeTab === 'agents' && (
              <AgentTable rows={rows} filters={filters} setFilters={setFilters} />
            )}

            {activeTab === 'settings' && (
              <section className="rounded-[2rem] border border-amber-200 bg-stone-50/84 p-6 shadow-xl backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/72">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-200">
                  ⚙️ Settings
                </p>

                <h2 className="font-serif text-3xl font-black">Google Sheet Connection</h2>

                <div className="mt-5 space-y-4 text-sm leading-7 text-stone-700 dark:text-stone-200">
                  <p>
                    <strong>1.</strong> Replace your existing Apps Script with the full updated{' '}
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">apps-script/code.gs</code>. It keeps the QA form and adds the read-only dashboard API.
                  </p>

                  <p>
                    <strong>2.</strong> Deploy the Apps Script as a Web App and copy its <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">/exec</code> URL.
                  </p>

                  <p>
                    <strong>3.</strong> Create <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">client/.env</code> from <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">client/.env.example</code> and add the deployment URL and matching API key.
                  </p>

                  <p>
                    <strong>4.</strong> The only agent source used by this app is the <strong>Agents Reviwed</strong> tab in spreadsheet <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">1GpR3siePgY45jGJfsAB2Q1obCW34A-tfKJOrI8ruEwg</code>.
                  </p>
                </div>
              </section>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}