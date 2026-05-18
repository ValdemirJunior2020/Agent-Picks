// client/src/App.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Moon,
  RefreshCcw,
  Settings,
  Sun,
  Table2,
  Wheat,
  Cross,
  ShieldCheck,
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

const QA_DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']

const demoPayload = {
  success: true,
  rows: [
    {
      sheetName: 'TEP QA',
      rowNumber: 57,
      values: ['Rhea May Primavera', 'W20 2/17/2025', 'Ginette Salvio', true, 'CS/35 needs work'],
    },
    {
      sheetName: 'TELUS',
      rowNumber: 12,
      values: ['Maria Santos', 'W24 6/1/2026', 'Barbara Kalchik', true, 'CS/82 TS needs coaching'],
    },
    {
      sheetName: 'BUW QA',
      rowNumber: 65,
      values: ['Merliz Signey De Paz', 'W18 11/24/2024', 'Nicole C Demafelix', true, 'G/50 CS/50'],
    },
    {
      sheetName: 'WNS QA',
      rowNumber: 22,
      values: ['Ana Cruz', 'W25 9/22/2025', 'WNS Sup', true, 'G/78 CS/92 Questioning on Schedule'],
    },
    {
      sheetName: 'CON QA',
      rowNumber: 78,
      values: ['James Eduard Balandra', 'W17 11/10/2024', 'Norte, Christine Ann C', true, 'G/50 CS/16'],
    },
  ],
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-white/72 p-4 shadow-sm backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/72">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-2xl">✝️</span>
      </div>

      <div className="mt-3 text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
        {label}
      </div>

      <div className="font-serif text-3xl font-black text-stone-900 dark:text-stone-50">
        {value}
      </div>

      <div className="text-sm text-stone-600 dark:text-stone-300">{sub}</div>
    </div>
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
  const [activeTab, setActiveTab] = useState('daily')
  const [dark, setDark] = useState(false)
  const [payload, setPayload] = useState(demoPayload)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    center: 'ALL',
    supervisor: 'ALL',
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

  const rows = useMemo(() => normalizeRows(payload), [payload])
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
      const aDay = a?.meeting?.dayName || a?.meeting?.day || ''
      const bDay = b?.meeting?.dayName || b?.meeting?.day || ''

      const aDayPriority = getDayPriority(aDay, currentDayName)
      const bDayPriority = getDayPriority(bDay, currentDayName)

      if (aDayPriority !== bDayPriority) {
        return aDayPriority - bDayPriority
      }

      return timeToMinutes(a?.meeting?.time || '') - timeToMinutes(b?.meeting?.time || '')
    })
  }, [qaPicks, currentDayName])

  const todaysPicks = useMemo(() => {
    const todaysRealQaMeetings = qaPicks.filter(
      (pick) => pick.meeting.dayName === currentDayName
    )

    if (todaysRealQaMeetings.length > 0) {
      return todaysRealQaMeetings
    }

    if (nextPickGroup?.meetings?.length) {
      const nextGroupLabels = nextPickGroup.meetings.map((meeting) => meeting.label)

      const nextGroupPicks = qaPicks.filter((pick) =>
        nextGroupLabels.includes(pick.meeting.label)
      )

      if (nextGroupPicks.length > 0) {
        return nextGroupPicks
      }
    }

    if (!nextMeeting) return []

    const fallback = qaPicks.find(
      (pick) =>
        pick.meeting.center === nextMeeting.center &&
        pick.meeting.label === nextMeeting.label
    )

    return fallback ? [fallback] : []
  }, [qaPicks, currentDayName, nextPickGroup, nextMeeting])

  const csReviewNeeded = rows.filter((row) => row.csScore != null && row.csScore < 90).length

  const groupReviewNeeded = rows.filter(
    (row) => row.groupScore != null && row.groupScore < 85
  ).length

  const strongExamples = rows.filter(
    (row) =>
      (row.csScore == null || row.csScore >= 90) &&
      (row.groupScore == null || row.groupScore >= 85) &&
      !row.riskWords
  ).length

  async function loadLive() {
    setLoading(true)
    setError('')

    try {
      const data = await fetchAgentRows()
      setPayload(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
      setPayload(demoPayload)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLive()
  }, [])

  const tabs = [
    { id: 'overview', label: 'Week Overview', icon: CalendarDays },
    { id: 'daily', label: "Today's Picks", icon: Wheat },
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
                <h1 className="font-serif text-3xl font-black leading-none">
                  Agent Picks
                </h1>
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  QA Call Center Tool for Barbara Kalchik • Review picks, not agent labels.
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
              <p className="font-serif text-xl font-black">Warm QA View</p>
              <p className="text-sm opacity-90">
                Smart review picks from your Google Sheet.
              </p>
            </div>

            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === id
                      ? 'bg-amber-800 text-white shadow'
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
              This tool does not label agents as bad. It identifies calls or QA records that may need review.
              A low score may reflect one specific call issue, not the agent’s overall performance.
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/88 p-4 font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100">
                Live sheet not connected yet: {error}. Showing demo data until your Apps Script URL is added.
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-amber-300 bg-amber-100/90 p-4 font-bold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                ✨ Reading Google Sheets, checking KPI scores, scanning notes, and preparing Barbara&apos;s review picks...
              </div>
            )}

            {activeTab === 'daily' && (
              <TodaySpotlight
                picks={todaysPicks}
                now={now}
                nextMeeting={nextMeeting}
              />
            )}

            {activeTab === 'overview' && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    icon={ShieldCheck}
                    label="Rows Loaded"
                    value={rows.length}
                    sub={
                      lastUpdated
                        ? `Updated ${lastUpdated.toLocaleTimeString()}`
                        : 'Demo/live data'
                    }
                  />

                  <Stat
                    icon={CalendarDays}
                    label="CS Review Needed"
                    value={csReviewNeeded}
                    sub="CS records below 90%"
                  />

                  <Stat
                    icon={Wheat}
                    label="Group Review Needed"
                    value={groupReviewNeeded}
                    sub="Group records below 85%"
                  />

                  <Stat
                    icon={Cross}
                    label="Strong Examples"
                    value={strongExamples}
                    sub="Green highlight candidates"
                  />
                </div>

                <div className="grid gap-5">
                  {orderedQaPicks.map((pick) => (
                    <DayCard
                      key={`${pick.meeting.dayName}-${pick.meeting.label}`}
                      pick={pick}
                    />
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

                <h2 className="font-serif text-3xl font-black">
                  Google Sheet Connection
                </h2>

                <div className="mt-5 space-y-4 text-sm leading-7 text-stone-700 dark:text-stone-200">
                  <p>
                    <strong>1.</strong> Open{' '}
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">
                      apps-script/code.gs
                    </code>
                    , paste it into Apps Script, and deploy as a Web App.
                  </p>

                  <p>
                    <strong>2.</strong> Create{' '}
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">
                      client/.env
                    </code>{' '}
                    from{' '}
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">
                      .env.example
                    </code>
                    .
                  </p>

                  <p>
                    <strong>3.</strong> Set{' '}
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">
                      VITE_APPS_SCRIPT_URL
                    </code>{' '}
                    and{' '}
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">
                      VITE_AGENT_PICKS_API_KEY
                    </code>
                    .
                  </p>

                  <p>
                    <strong>4.</strong> Your background image must stay here:
                    <br />
                    <code className="rounded bg-amber-100 px-2 py-1 dark:bg-stone-800">
                      client/public/bg.png
                    </code>
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