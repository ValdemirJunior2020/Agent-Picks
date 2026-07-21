// client/src/lib/picker.js
import { MEETINGS } from './schedule.js'

export const CS_KPI = 90
export const GROUP_KPI = 85
export const CRITICAL_SCORE = 50
export const SPECIAL_CORRECTION_DAYS = 60

function text(value) {
  return String(value ?? '').trim()
}

function upper(value) {
  return text(value).toUpperCase()
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(
    String(value)
      .replace('%', '')
      .trim()
  )

  return Number.isFinite(parsed) ? parsed : null
}

function parseDate(value) {
  if (!value) return null

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value
  }

  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    const excelEpoch = new Date(
      Date.UTC(1899, 11, 30)
    )

    const date = new Date(
      excelEpoch.getTime() +
        value * 86400000
    )

    return Number.isNaN(date.getTime())
      ? null
      : date
  }

  const source = text(value)

  if (!source) return null

  if (/^\d+(\.\d+)?$/.test(source)) {
    const numeric = Number(source)

    if (
      numeric > 20000 &&
      numeric < 100000
    ) {
      const excelEpoch = new Date(
        Date.UTC(1899, 11, 30)
      )

      const date = new Date(
        excelEpoch.getTime() +
          numeric * 86400000
      )

      return Number.isNaN(date.getTime())
        ? null
        : date
    }
  }

  const dateOnlyMatch = source.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  )

  if (dateOnlyMatch) {
    const date = new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3])
    )

    return Number.isNaN(date.getTime())
      ? null
      : date
  }

  const usMatch = source.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/
  )

  if (usMatch) {
    const year = Number(
      usMatch[3].length === 2
        ? `20${usMatch[3]}`
        : usMatch[3]
    )

    const date = new Date(
      year,
      Number(usMatch[1]) - 1,
      Number(usMatch[2])
    )

    return Number.isNaN(date.getTime())
      ? null
      : date
  }

  const parsed = new Date(source)

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed
}

function formatDate(date) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return 'N/A'
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }
  )
}

function daysBetween(
  startDate,
  endDate = new Date()
) {
  if (!startDate) return null

  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  )

  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  )

  return Math.max(
    0,
    Math.floor(
      (end.getTime() - start.getTime()) /
        86400000
    )
  )
}

function average(values) {
  const valid = values.filter(
    (value) => Number.isFinite(value)
  )

  if (!valid.length) return null

  const total = valid.reduce(
    (sum, value) => sum + value,
    0
  )

  return (
    Math.round(
      (total / valid.length) * 10
    ) / 10
  )
}

function normalizeAgentName(value) {
  return text(value).replace(
    /\s+/g,
    ' '
  )
}

export function normalizeCenter(value) {
  const source = upper(value).replace(
    /\s+/g,
    ' '
  )

  if (
    source.includes('BUWELO') ||
    source.includes('BU W') ||
    source === 'BUW'
  ) {
    return 'BUWELO'
  }

  if (
    source.includes('CONCENTRIX') ||
    source === 'CON' ||
    source === 'CON QA'
  ) {
    return 'CONCENTRIX'
  }

  if (
    source.includes('TELUS') ||
    source === 'TEL US'
  ) {
    return 'TELUS'
  }

  if (source.includes('TEP')) {
    return 'TEP'
  }

  if (source.includes('WNS')) {
    return 'WNS'
  }

  if (source.includes('ICC')) {
    return 'ICC'
  }

  return source || 'UNKNOWN'
}

function normalizeQaType(value) {
  const source = upper(value)

  if (
    source === 'CS' ||
    source.includes('CUSTOMER SERVICE')
  ) {
    return 'CS'
  }

  if (
    source === 'GROUP' ||
    source === 'GROUPS' ||
    source.includes('GROUP')
  ) {
    return 'Groups'
  }

  return text(value)
}

function getReviewRows(payload) {
  if (Array.isArray(payload?.reviews)) {
    return payload.reviews
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows
  }

  return []
}

function readLegacyValue(row, index) {
  return Array.isArray(row?.values)
    ? row.values[index]
    : undefined
}

function normalizeReview(row, index) {
  const agentName = normalizeAgentName(
    row.agentName ??
      row['Agent Name'] ??
      readLegacyValue(row, 4) ??
      readLegacyValue(row, 0)
  )

  const rawCenter =
    row.callCenter ??
    row.center ??
    row['Call Center'] ??
    readLegacyValue(row, 5) ??
    row.sheetName

  const qaType = normalizeQaType(
    row.qaType ??
      row['QA Type'] ??
      readLegacyValue(row, 7)
  )

  const score = toNumber(
    row.finalScore ??
      row.score ??
      row['Final Score'] ??
      readLegacyValue(row, 8)
  )

  const agentStartDate = parseDate(
    row.agentStartDate ??
      row.startDate ??
      row['Agent Start Date'] ??
      row['Start Date'] ??
      row['Review Date'] ??
      readLegacyValue(row, 1)
  )

  const reviewDate = parseDate(
    row.reviewDate ??
      row.todayDate ??
      row["Today's Date"] ??
      row.savedTimestamp ??
      readLegacyValue(row, 2) ??
      readLegacyValue(row, 0)
  )

  const notes = text(
    row.issueSummary ??
      row.notes ??
      row.customNotes ??
      row['Notes / Comments'] ??
      ''
  )

  return {
    id:
      row.id ||
      `review-${
        row.rowNumber ||
        index + 2
      }`,

    rowNumber:
      Number(row.rowNumber) ||
      index + 2,

    agentName,

    center: normalizeCenter(
      rawCenter
    ),

    originalCenter: text(
      rawCenter
    ),

    qaType,
    score,
    agentStartDate,
    reviewDate,

    callId: text(
      row.callId ??
        row['Call ID'] ??
        readLegacyValue(row, 6)
    ),

    evaluator: text(
      row.evaluator ??
        row.Evaluator ??
        readLegacyValue(row, 3)
    ),

    notes,
    raw: row,
  }
}

function getEarliestDate(values) {
  const valid = values
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.getTime() - b.getTime()
    )

  return valid[0] || null
}

function getLatestDate(values) {
  const valid = values
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.getTime() - a.getTime()
    )

  return valid[0] || null
}

function buildExposureLabel(agent) {
  if (agent.specialCorrection) {
    return 'Special Correction'
  }

  if (agent.criticalUnder50) {
    return 'Critical — Under 50'
  }

  if (
    agent.csBelowKpi &&
    agent.groupBelowKpi
  ) {
    return 'Below CS and Groups KPI'
  }

  if (agent.csBelowKpi) {
    return 'Below CS KPI'
  }

  if (agent.groupBelowKpi) {
    return 'Below Groups KPI'
  }

  return 'Meeting KPI'
}

export function normalizeRows(
  payload,
  now = new Date()
) {
  const reviews = getReviewRows(payload)
    .map(normalizeReview)
    .filter(
      (review) =>
        review.agentName &&
        Number.isFinite(
          review.score
        )
    )

  const grouped = new Map()

  reviews.forEach((review) => {
    const key =
      `${review.center}|` +
      upper(review.agentName)

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            '-'
          ),

        agentName:
          review.agentName,

        center:
          review.center,

        callCenters:
          new Set(),

        reviews: [],
      })
    }

    const agent =
      grouped.get(key)

    agent.callCenters.add(
      review.originalCenter ||
        review.center
    )

    agent.reviews.push(
      review
    )
  })

  return Array.from(
    grouped.values()
  )
    .map((agent) => {
      const csReviews =
        agent.reviews.filter(
          (review) =>
            review.qaType === 'CS'
        )

      const groupReviews =
        agent.reviews.filter(
          (review) =>
            review.qaType ===
            'Groups'
        )

      const csAverage = average(
        csReviews.map(
          (review) =>
            review.score
        )
      )

      const groupAverage =
        average(
          groupReviews.map(
            (review) =>
              review.score
          )
        )

      const startDateObject =
        getEarliestDate(
          agent.reviews.map(
            (review) =>
              review.agentStartDate
          )
        )

      const lastReviewDateObject =
        getLatestDate(
          agent.reviews.map(
            (review) =>
              review.reviewDate
          )
        )

      const daysOnPhones =
        daysBetween(
          startDateObject,
          now
        )

      /*
       * The normal KPI rule uses
       * each agent's average score.
       */
      const csBelowKpi =
        csAverage !== null &&
        csAverage < CS_KPI

      const groupBelowKpi =
        groupAverage !== null &&
        groupAverage < GROUP_KPI

      /*
       * Under 50 checks every
       * individual saved review.
       */
      const under50Reviews =
        agent.reviews.filter(
          (review) =>
            Number.isFinite(
              review.score
            ) &&
            review.score <
              CRITICAL_SCORE
        )

      const scoresUnder50 =
        under50Reviews.map(
          (review) =>
            review.score
        )

      const allScores =
        agent.reviews
          .map(
            (review) =>
              review.score
          )
          .filter(
            (score) =>
              Number.isFinite(
                score
              )
          )

      const lowestScore =
        allScores.length
          ? Math.min(
              ...allScores
            )
          : null

      const criticalUnder50 =
        under50Reviews.length > 0

      const hasTwoMonthsOnPhones =
        daysOnPhones !== null &&
        daysOnPhones >=
          SPECIAL_CORRECTION_DAYS

      /*
       * Special Correction requires:
       *
       * 1. At least one review under 50.
       * 2. At least 60 days on phones.
       */
      const specialCorrection =
        criticalUnder50 &&
        hasTwoMonthsOnPhones

      const sortedReviews = [
        ...agent.reviews,
      ].sort(
        (a, b) =>
          (
            b.reviewDate?.getTime() ||
            0
          ) -
          (
            a.reviewDate?.getTime() ||
            0
          )
      )

      const latestReview =
        sortedReviews[0]

      const normalizedAgent = {
        ...agent,

        callCenters:
          Array.from(
            agent.callCenters
          ).filter(Boolean),

        reviews:
          sortedReviews,

        totalReviews:
          agent.reviews.length,

        csReviewCount:
          csReviews.length,

        groupReviewCount:
          groupReviews.length,

        csAverage,
        groupAverage,

        /*
         * Compatibility names used
         * by the weekly-picks cards.
         */
        csScore:
          csAverage,

        groupScore:
          groupAverage,

        hasGroupCalls:
          groupReviews.length > 0,

        startDateObject,

        startDate:
          formatDate(
            startDateObject
          ),

        lastReviewDateObject,

        lastReviewLabel:
          formatDate(
            lastReviewDateObject
          ),

        daysOnPhones,

        daysSinceStart:
          daysOnPhones,

        csBelowKpi,
        groupBelowKpi,

        belowKpi:
          csBelowKpi ||
          groupBelowKpi,

        lowestScore,
        scoresUnder50,
        under50Reviews,
        criticalUnder50,
        hasTwoMonthsOnPhones,
        specialCorrection,

        latestCallId:
          latestReview?.callId ||
          '',

        evaluator:
          latestReview?.evaluator ||
          '',

        notes:
          latestReview?.notes ||
          '',

        sourceSheet:
          'Agents Reviwed',

        exposureLabel: '',

        isActive: true,
      }

      normalizedAgent.exposureLabel =
        buildExposureLabel(
          normalizedAgent
        )

      return normalizedAgent
    })
    .sort((a, b) => {
      if (
        a.specialCorrection !==
        b.specialCorrection
      ) {
        return a.specialCorrection
          ? -1
          : 1
      }

      if (
        a.criticalUnder50 !==
        b.criticalUnder50
      ) {
        return a.criticalUnder50
          ? -1
          : 1
      }

      if (
        a.belowKpi !==
        b.belowKpi
      ) {
        return a.belowKpi
          ? -1
          : 1
      }

      return a.agentName.localeCompare(
        b.agentName
      )
    })
}

function severityFor(
  agent,
  type
) {
  const score =
    type === 'group'
      ? agent.groupAverage
      : agent.csAverage

  const kpi =
    type === 'group'
      ? GROUP_KPI
      : CS_KPI

  if (score === null) {
    return -Infinity
  }

  let severity =
    (kpi - score) * 100

  if (agent.specialCorrection) {
    severity += 10000
  } else if (
    agent.criticalUnder50
  ) {
    severity += 5000
  }

  severity += Math.min(
    agent.totalReviews,
    25
  )

  return severity
}

function pickLowest(
  candidates,
  type
) {
  return (
    [...candidates].sort(
      (a, b) =>
        severityFor(b, type) -
        severityFor(a, type)
    )[0] || null
  )
}

function pickHighest(
  candidates,
  type
) {
  const property =
    type === 'group'
      ? 'groupAverage'
      : 'csAverage'

  return (
    [...candidates].sort(
      (a, b) => {
        const scoreDifference =
          (
            b[property] ?? -1
          ) -
          (
            a[property] ?? -1
          )

        if (
          scoreDifference !== 0
        ) {
          return scoreDifference
        }

        return (
          b.totalReviews -
          a.totalReviews
        )
      }
    )[0] || null
  )
}

function rowsForMeeting(
  rows,
  meeting
) {
  return rows.filter(
    (row) =>
      row.center ===
      meeting.center
  )
}

export function generatePicks(
  allRows
) {
  const rows = allRows.filter(
    (row) => row.isActive
  )

  return MEETINGS.map(
    (meeting) => {
      if (
        meeting.summaryOnly
      ) {
        const exposed =
          rows.filter(
            (agent) =>
              agent.belowKpi
          )

        return {
          meeting,
          summaryOnly: true,
          riskyCount:
            exposed.length,
          agents:
            exposed.slice(0, 8),
        }
      }

      const centerRows =
        rowsForMeeting(
          rows,
          meeting
        )

      const csReviewCandidates =
        centerRows.filter(
          (agent) =>
            agent.csBelowKpi
        )

      const groupReviewCandidates =
        centerRows.filter(
          (agent) =>
            agent.groupBelowKpi
        )

      const strongCsCandidates =
        centerRows.filter(
          (agent) =>
            agent.csAverage !==
              null &&
            agent.csAverage >=
              CS_KPI
        )

      const strongGroupCandidates =
        centerRows.filter(
          (agent) =>
            agent.groupAverage !==
              null &&
            agent.groupAverage >=
              GROUP_KPI
        )

      const badCs =
        pickLowest(
          csReviewCandidates,
          'cs'
        )

      const badGroup =
        meeting.csOnly
          ? null
          : pickLowest(
              groupReviewCandidates,
              'group'
            )

      const bestGoodCs =
        pickHighest(
          strongCsCandidates,
          'cs'
        )

      const bestGoodGroup =
        meeting.csOnly
          ? null
          : pickHighest(
              strongGroupCandidates,
              'group'
            )

      const specialCount =
        centerRows.filter(
          (agent) =>
            agent.specialCorrection
        ).length

      const criticalCount =
        centerRows.filter(
          (agent) =>
            agent.criticalUnder50
        ).length

      return {
        meeting,

        centerRowsCount:
          centerRows.length,

        eligibleRowsCount:
          centerRows.length,

        badCs,
        badGroup,
        bestGoodCs,
        bestGoodGroup,

        goodAgents: [
          bestGoodCs,
          bestGoodGroup,
        ].filter(Boolean),

        specialCount,
        criticalCount,

        notes: [
          specialCount > 0 &&
            `${specialCount} agent(s) meet the special correction rule: at least one review under 50 and at least 60 days on the phones.`,

          criticalCount >
            specialCount &&
            `${
              criticalCount -
              specialCount
            } additional agent(s) have at least one review under 50 but have not yet reached 60 phone days.`,

          !badCs &&
            'No CS average below the 90% KPI was found for this center.',

          meeting.csOnly &&
            'TELUS is CS only. Group pick skipped.',

          !meeting.csOnly &&
            !badGroup &&
            'No Groups average below the 85% KPI was found for this center.',

          !bestGoodCs &&
            'No CS average at or above 90% was found for a strong example.',

          !meeting.csOnly &&
            !bestGoodGroup &&
            'No Groups average at or above 85% was found for a strong example.',
        ].filter(Boolean),
      }
    }
  )
}

export function filterRows(
  rows,
  filters
) {
  const search = upper(
    filters.search
  )

  return rows.filter((row) => {
    if (
      filters.center !== 'ALL' &&
      row.center !==
        filters.center
    ) {
      return false
    }

    if (
      filters.performance ===
        'BELOW_KPI' &&
      !row.belowKpi
    ) {
      return false
    }

    if (
      filters.performance ===
        'BAD_CS' &&
      !row.csBelowKpi
    ) {
      return false
    }

    if (
      filters.performance ===
        'BAD_GROUP' &&
      !row.groupBelowKpi
    ) {
      return false
    }

    if (
      filters.performance ===
        'UNDER_50' &&
      !row.criticalUnder50
    ) {
      return false
    }

    if (
      filters.performance ===
        'SPECIAL' &&
      !row.specialCorrection
    ) {
      return false
    }

    if (
      filters.performance ===
        'PASSING' &&
      row.belowKpi
    ) {
      return false
    }

    if (!search) {
      return true
    }

    const searchableText = `
      ${row.agentName}
      ${row.center}
      ${row.callCenters.join(' ')}
      ${row.exposureLabel}
      ${row.latestCallId}
      ${row.evaluator}
      ${row.notes}
    `

    return upper(
      searchableText
    ).includes(search)
  })
}