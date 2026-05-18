// client/src/lib/reviewEligibility.js

const REVIEW_LOCK_DAYS = 90
const NESTING_DAYS = 45

function normalize(value) {
  return String(value ?? '').trim()
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function daysBetween(dateA, dateB) {
  const start = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())
  const end = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate())
  return Math.floor((end.getTime() - start.getTime()) / 86400000)
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

function inferReviewYear(month, day, now = new Date()) {
  let year = now.getFullYear()
  let date = new Date(year, month - 1, day)

  const futureBuffer = addDays(now, 7)

  if (date > futureBuffer) {
    year -= 1
    date = new Date(year, month - 1, day)
  }

  return date
}

export function parseStartDate(startDateText, now = new Date()) {
  const text = normalize(startDateText)

  const dateMatch = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)

  if (!dateMatch) return null

  const month = Number(dateMatch[1])
  const day = Number(dateMatch[2])
  const yearText = dateMatch[3]
  const year = Number(yearText.length === 2 ? `20${yearText}` : yearText)

  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) return null

  return date
}

export function parseReviewDatesFromText(text, now = new Date()) {
  const source = normalize(text)
  const dates = []

  if (!source) return dates

  const patterns = [
    // 12/30>G/50 CS/16
    /(?:^|[^0-9])(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*(?=>|\s|$)/gi,

    // G>5/16>100
    /(?:G|GRP|GROUP|CS)\s*>\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*(?=>|\s|$)/gi,

    // Review 5/16 or QA: 5/16
    /(?:review|rev|qa)\s*[:#-]?\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/gi,
  ]

  patterns.forEach((pattern) => {
    let match

    while ((match = pattern.exec(source)) !== null) {
      const month = Number(match[1])
      const day = Number(match[2])
      const yearText = match[3]

      if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
        continue
      }

      let date

      if (yearText) {
        const year = Number(yearText.length === 2 ? `20${yearText}` : yearText)
        date = new Date(year, month - 1, day)
      } else {
        date = inferReviewYear(month, day, now)
      }

      if (!Number.isNaN(date.getTime())) {
        dates.push(date)
      }
    }
  })

  return dates
}

export function getMostRecentReviewDate(text, now = new Date()) {
  const dates = parseReviewDatesFromText(text, now)

  if (!dates.length) return null

  return dates.sort((a, b) => b.getTime() - a.getTime())[0]
}

export function getReviewStatus({
  startDateText = '',
  reviewText = '',
  isReviewedChecked = false,
  now = new Date(),
}) {
  const startDate = parseStartDate(startDateText, now)
  const lastReviewDate = getMostRecentReviewDate(reviewText, now)

  const daysSinceStart = startDate ? daysBetween(startDate, now) : null
  const isNesting =
    daysSinceStart !== null &&
    daysSinceStart >= 0 &&
    daysSinceStart < NESTING_DAYS

  const daysSinceLastReview = lastReviewDate
    ? daysBetween(lastReviewDate, now)
    : null

  const eligibleAgainDate = lastReviewDate
    ? addDays(lastReviewDate, REVIEW_LOCK_DAYS)
    : null

  const wasReviewedRecently =
    lastReviewDate &&
    daysSinceLastReview >= 0 &&
    daysSinceLastReview < REVIEW_LOCK_DAYS

  const hasReviewDateButCheckboxMissing =
    !!lastReviewDate && !isReviewedChecked

  const hasCheckboxButNoReviewDate =
    isReviewedChecked && !lastReviewDate

  if (isNesting) {
    return {
      status: 'nesting',
      shouldSkip: true,
      reason: 'Nesting / Training agent — separated from regular QA rotation.',
      lastReviewDate,
      lastReviewLabel: lastReviewDate ? formatDate(lastReviewDate) : 'No review date found',
      eligibleAgainDate,
      eligibleAgainLabel: eligibleAgainDate ? formatDate(eligibleAgainDate) : 'Nesting / Training',
      daysSinceLastReview,
      daysSinceStart,
      isNesting,
      isReviewedChecked,
      hasReviewDateButCheckboxMissing,
      hasCheckboxButNoReviewDate,
    }
  }

  if (wasReviewedRecently) {
    return {
      status: 'recently-reviewed',
      shouldSkip: true,
      reason: `Reviewed within the last ${REVIEW_LOCK_DAYS} days.`,
      lastReviewDate,
      lastReviewLabel: formatDate(lastReviewDate),
      eligibleAgainDate,
      eligibleAgainLabel: formatDate(eligibleAgainDate),
      daysSinceLastReview,
      daysSinceStart,
      isNesting,
      isReviewedChecked,
      hasReviewDateButCheckboxMissing,
      hasCheckboxButNoReviewDate,
    }
  }

  if (hasCheckboxButNoReviewDate) {
    return {
      status: 'checked-no-date',
      shouldSkip: true,
      reason: 'Review checkbox is checked, but no review date was found. Needs sheet cleanup.',
      lastReviewDate: null,
      lastReviewLabel: 'Reviewed checked, but no date found',
      eligibleAgainDate: null,
      eligibleAgainLabel: 'Needs sheet cleanup',
      daysSinceLastReview: null,
      daysSinceStart,
      isNesting,
      isReviewedChecked,
      hasReviewDateButCheckboxMissing,
      hasCheckboxButNoReviewDate,
    }
  }

  if (lastReviewDate && daysSinceLastReview >= REVIEW_LOCK_DAYS) {
    return {
      status: 'eligible-reviewed-before',
      shouldSkip: false,
      reason: 'Reviewed before, but eligible again because last review is older than 90 days.',
      lastReviewDate,
      lastReviewLabel: formatDate(lastReviewDate),
      eligibleAgainDate,
      eligibleAgainLabel: formatDate(eligibleAgainDate),
      daysSinceLastReview,
      daysSinceStart,
      isNesting,
      isReviewedChecked,
      hasReviewDateButCheckboxMissing,
      hasCheckboxButNoReviewDate,
    }
  }

  return {
    status: 'never-reviewed',
    shouldSkip: false,
    reason: 'No previous review found — eligible for QA rotation.',
    lastReviewDate: null,
    lastReviewLabel: 'No previous review found',
    eligibleAgainDate: null,
    eligibleAgainLabel: 'Available now',
    daysSinceLastReview: null,
    daysSinceStart,
    isNesting,
    isReviewedChecked,
    hasReviewDateButCheckboxMissing,
    hasCheckboxButNoReviewDate,
  }
}