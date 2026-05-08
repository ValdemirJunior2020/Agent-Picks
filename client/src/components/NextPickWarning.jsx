// client/src/components/NextPickWarning.jsx
import { AlertTriangle, CalendarClock } from 'lucide-react'

export default function NextPickWarning({ nextPickGroup }) {
  if (!nextPickGroup || !nextPickGroup.date || !nextPickGroup.meetings?.length) {
    return null
  }

  const meetingDate = nextPickGroup.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const meetingText = nextPickGroup.meetings
    .map((meeting) => `${meeting.label} at ${meeting.time}`)
    .join(' and ')

  return (
    <div className="rounded-[1.5rem] border border-amber-400 bg-amber-100/95 p-4 text-amber-950 shadow-md backdrop-blur dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-700 text-white shadow">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em]">
            <CalendarClock className="h-4 w-4" />
            Automatic Pick Warning
          </div>

          <p className="mt-1 text-base font-bold leading-relaxed">
            Your next picks will be generated automatically on{' '}
            <span className="font-black text-rose-800 dark:text-rose-200">
              {meetingDate}
            </span>{' '}
            for{' '}
            <span className="font-black text-rose-800 dark:text-rose-200">
              {meetingText}
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  )
}