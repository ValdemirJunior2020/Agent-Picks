// client/src/lib/schedule.js
import { addDays, format, isBefore, setDay, setHours, setMinutes, setSeconds } from 'date-fns'

export const MEETINGS = [
  {
    dayName: 'Monday',
    day: 1,
    time: '9:00 AM',
    hour: 9,
    minute: 0,
    center: 'MANAGERS',
    label: 'Managers Meeting',
    summaryOnly: true,
    autoPick: false,
    emoji: '📊',
  },
  {
    dayName: 'Tuesday',
    day: 2,
    time: '10:00 AM',
    hour: 10,
    minute: 0,
    center: 'TEP',
    label: 'TEP QA',
    summaryOnly: false,
    autoPick: true,
    emoji: '🌿',
  },
  {
    dayName: 'Tuesday',
    day: 2,
    time: '11:00 AM',
    hour: 11,
    minute: 0,
    center: 'TELUS',
    label: 'TELUS QA',
    csOnly: true,
    summaryOnly: false,
    autoPick: true,
    emoji: '🕊️',
  },
  {
    dayName: 'Wednesday',
    day: 3,
    time: '10:30 AM',
    hour: 10,
    minute: 30,
    center: 'BUWELO',
    label: 'BUWELO Colombia + Ghana',
    summaryOnly: false,
    autoPick: true,
    emoji: '🌎',
  },
  {
    dayName: 'Thursday',
    day: 4,
    time: '10:00 AM',
    hour: 10,
    minute: 0,
    center: 'WNS',
    label: 'WNS QA',
    summaryOnly: false,
    autoPick: true,
    emoji: '🌾',
  },
  {
    dayName: 'Friday',
    day: 5,
    time: '10:00 AM',
    hour: 10,
    minute: 0,
    center: 'CONCENTRIX',
    label: 'CONCENTRIX QA',
    summaryOnly: false,
    autoPick: true,
    emoji: '🔥',
  },
]

export function getNextMeeting(now = new Date()) {
  const candidates = MEETINGS
    .filter((meeting) => meeting.autoPick === true)
    .map((meeting) => {
      let date = setDay(now, meeting.day, { weekStartsOn: 1 })
      date = setSeconds(setMinutes(setHours(date, meeting.hour), meeting.minute), 0)

      if (isBefore(date, now)) {
        date = addDays(date, 7)
      }

      return {
        ...meeting,
        date,
      }
    })
    .sort((a, b) => a.date - b.date)

  return candidates[0]
}

export function getTodayMeetings(now = new Date()) {
  const todayName = format(now, 'EEEE')

  return MEETINGS.filter(
    (meeting) =>
      meeting.dayName === todayName &&
      meeting.autoPick === true
  )
}

export function formatCountdown(targetDate, now = new Date()) {
  if (!targetDate) return 'N/A'

  const ms = Math.max(0, targetDate.getTime() - now.getTime())
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`

  return `${minutes}m`
}

export function todayLabel(date = new Date()) {
  return format(date, 'EEEE, MMM d, yyyy')
}