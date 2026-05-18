// client/src/lib/picker.js
import { MEETINGS } from './schedule'

const CENTER_ALIASES = [
  { center: 'TEP', patterns: ['TEP'] },
  { center: 'TELUS', patterns: ['TELUS', 'TEL US', 'TEL'] },
  { center: 'BUWELO', patterns: ['BUWELO', 'BU W', 'BUW', 'COLOMBIA', 'GHANA'] },
  { center: 'WNS', patterns: ['WNS'] },
  { center: 'CONCENTRIX', patterns: ['CONCENTRIX', 'CON QA', 'CON'] },
  { center: 'ICC', patterns: ['ICC'] },
]

const REVIEW_LOCK_DAYS = 90

function normalize(value) {
  return String(value ?? '').trim()
}

function upper(value) {
  return normalize(value).toUpperCase()
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
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

function parseReviewDatesFromText(text) {
  const source = normalize(text)
  const dates = []

  if (!source) return dates

  const patterns = [
    // 12/30>G/50 CS/16
    /(?:^|[^0-9])(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*(?=>|\s|$)/gi,

    // G>5/16>100
    /(?:G|GRP|GROUP|CS)\s*>\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*(?=>|\s|$)/gi,

    // Review 5/16 100
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
        date = inferReviewYear(month, day)
      }

      if (!Number.isNaN(date.getTime())) {
        dates.push(date)
      }
    }
  })

  return dates
}

function getMostRecentReviewDate(text) {
  const dates = parseReviewDatesFromText(text)

  if (!dates.length) return null

  return dates.sort((a, b) => b.getTime() - a.getTime())[0]
}

function getReviewEligibility(lastReviewDate, now = new Date()) {
  if (!lastReviewDate) {
    return {
      isRecentlyReviewed: false,
      daysSinceLastReview: null,
      eligibleAgainDate: null,
      eligibleAgainLabel: '',
      lastReviewLabel: '',
    }
  }

  const daysSinceLastReview = daysBetween(lastReviewDate, now)
  const eligibleAgainDate = addDays(lastReviewDate, REVIEW_LOCK_DAYS)
  const isRecentlyReviewed = daysSinceLastReview >= 0 && daysSinceLastReview < REVIEW_LOCK_DAYS

  return {
    isRecentlyReviewed,
    daysSinceLastReview,
    eligibleAgainDate,
    eligibleAgainLabel: formatDate(eligibleAgainDate),
    lastReviewLabel: formatDate(lastReviewDate),
  }
}

export function inferCenter(sheetName = '', row = {}) {
  const source = `${sheetName} ${Object.values(row).join(' ')}`.toUpperCase()

  const match = CENTER_ALIASES.find((item) =>
    item.patterns.some((pattern) => source.includes(pattern))
  )

  return (
    match?.center ||
    upper(sheetName).replace(' QA', '').replace('CALL CENTER', '').trim() ||
    'UNKNOWN'
  )
}

export function parseDateWeek(value) {
  const text = normalize(value)
  const dateMatch = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)

  let parsedDate = null

  if (dateMatch) {
    const [, m, d, y] = dateMatch
    const year = Number(y.length === 2 ? `20${y}` : y)
    parsedDate = new Date(year, Number(m) - 1, Number(d))
  }

  const weekMatch = text.match(/W\s*\.?\s*(\d+)/i)

  return {
    raw: text,
    date: parsedDate,
    week: weekMatch ? Number(weekMatch[1]) : null,
  }
}

export function parseScoresFromText(...parts) {
  const text = parts.map(normalize).join(' ').replace(/\s+/g, ' ')

  const score = {
    cs: null,
    group: null,
    hasGroupCalls: false,
    raw: text,
  }

  const csPatterns = [
    /CS\s*[/:>-]*\s*(\d{1,3})\s*%?/i,
    /(\d{1,3})\s*%?\s*CS/i,
  ]

  const groupPatterns = [
    /(?:^|\s|>)(?:G|GRP|GROUP)\s*[/:>-]*\s*(\d{1,3})\s*%?/i,
    /(\d{1,3})\s*%?\s*(?:G|GRP|GROUP)(?:\s|$)/i,
  ]

  const hasGroupCalls =
    /(?:^|\s|>)(G|GRP|GROUP)\s*[/:>-]*/i.test(text) ||
    /\d{1,3}\s*%?\s*(G|GRP|GROUP)(?:\s|$)/i.test(text)

  score.hasGroupCalls = hasGroupCalls

  for (const pattern of csPatterns) {
    const found = text.match(pattern)

    if (found) {
      score.cs = Number(found[1])
      break
    }
  }

  for (const pattern of groupPatterns) {
    const found = text.match(pattern)

    if (found) {
      score.group = Number(found[1])
      score.hasGroupCalls = true
      break
    }
  }

  return score
}

function cleanDisplayNotes(text = '') {
  return String(text)
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(true|false)$/i.test(part))
    .join(' | ')
}

export function normalizeRows(payload) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : []

  return rows
    .map((row, index) => {
      const sheetName = row.sheetName || row.sheet || row.sourceSheet || 'Unknown'
      const values = row.values || row.fullRow || []

      const rawTextFromObject = Object.values(row)
        .filter((value) => typeof value !== 'object')
        .join(' ')

      const fullText = `${values.join(' ')} ${rawTextFromObject}`.replace(/\s+/g, ' ')

      const agentName = normalize(
        row.agentName ||
          row.Agent ||
          row['Agent Name'] ||
          values[0]
      )

      const start = normalize(
        row.startDate ||
          row.Start ||
          row['Start Date'] ||
          values[1]
      )

      const supervisor = normalize(
        row.supervisor ||
          row.Supervisor ||
          values[2]
      )

      const reviewText = normalize(
        row.reviewText ||
          row.notes ||
          row.Notes ||
          row.Comments ||
          values.slice(3).join(' | ')
      )

      const notes = cleanDisplayNotes(reviewText)

      const reviewFlags = normalize(
        row.reviewFlags ||
          row.flags ||
          values
            .slice(3)
            .filter(
              (v) =>
                String(v).toLowerCase() === 'true' ||
                String(v).includes('✓')
            )
            .join(', ')
      )

      const scores = parseScoresFromText(fullText)
      const dateWeek = parseDateWeek(start)
      const center = inferCenter(sheetName, row)

      const dateSearchText = `${reviewText} ${fullText}`
      const lastReviewDate = getMostRecentReviewDate(dateSearchText)
      const reviewEligibility = getReviewEligibility(lastReviewDate)

      const riskWords =
        /(needs work|question|schedule|ts|terrible|low|markdown|fail|coaching|refund|not follow|escalat|not helpful|to be removed)/i.test(
          fullText
        )

      const isActive = !/(inactive|terminated|resigned|left company)/i.test(fullText)

      return {
        id: `${sheetName}-${row.rowNumber || index + 1}-${agentName}`,
        sourceSheet: sheetName,
        rowNumber: row.rowNumber || index + 1,
        center,
        agentName: agentName || `Row ${row.rowNumber || index + 1}`,
        startDate: start,
        supervisor,
        csScore: scores.cs,
        groupScore: scores.group,
        hasGroupCalls: scores.hasGroupCalls,
        notes,
        reviewText,
        reviewFlags,
        fullText,
        values,
        dateWeek,
        isActive,
        riskWords,

        lastReviewDate,
        lastReviewLabel: reviewEligibility.lastReviewLabel,
        daysSinceLastReview: reviewEligibility.daysSinceLastReview,
        isRecentlyReviewed: reviewEligibility.isRecentlyReviewed,
        eligibleAgainDate: reviewEligibility.eligibleAgainDate,
        eligibleAgainLabel: reviewEligibility.eligibleAgainLabel,
      }
    })
    .filter((row) => row.agentName && !/^agent\s*name$/i.test(row.agentName))
}

function reviewScore(agent, type = 'cs') {
  const value = type === 'group' ? agent.groupScore : agent.csScore
  const threshold = type === 'group' ? 85 : 90

  let score = value == null ? 25 : Math.max(0, threshold - value) * 10

  if (agent.riskWords) score += 35
  if (agent.hasGroupCalls && type === 'group') score += 20
  if (agent.reviewFlags) score += 8

  if (agent.lastReviewDate && !agent.isRecentlyReviewed) {
    score += Math.min(25, Math.max(0, (agent.daysSinceLastReview || 0) - REVIEW_LOCK_DAYS) / 5)
  }

  if (agent.isRecentlyReviewed) {
    score -= 9999
  }

  return score
}

function strongCsScore(agent) {
  const cs = agent.csScore ?? -1
  let score = cs

  if (agent.csScore != null && agent.csScore >= 90) score += 50
  if (agent.groupScore != null && agent.groupScore >= 85) score += 10
  if (agent.riskWords) score -= 30
  if (agent.reviewFlags) score += 5
  if (agent.isRecentlyReviewed) score -= 9999

  return score
}

function strongGroupScore(agent) {
  const group = agent.groupScore ?? -1
  let score = group

  if (agent.hasGroupCalls) score += 40
  if (agent.groupScore != null && agent.groupScore >= 85) score += 50
  if (agent.csScore != null && agent.csScore >= 90) score += 10
  if (agent.riskWords) score -= 30
  if (agent.reviewFlags) score += 5
  if (agent.isRecentlyReviewed) score -= 9999

  return score
}

function uniqueAgents(list) {
  const seen = new Set()

  return list.filter((agent) => {
    const key = `${agent.center}-${agent.agentName}-${agent.sourceSheet}-${agent.rowNumber}`.toLowerCase()

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function pickOne(candidates, usedIds, type, allowUsedIfNeeded = false) {
  if (!candidates.length) return null

  const eligible = candidates.filter((agent) => !agent.isRecentlyReviewed)
  const availablePool = eligible.filter((a) => !usedIds.has(a.id))

  if (availablePool.length) {
    const sorted = availablePool.sort((a, b) => reviewScore(b, type) - reviewScore(a, type))
    usedIds.add(sorted[0].id)
    return sorted[0]
  }

  if (allowUsedIfNeeded && eligible.length) {
    const sorted = eligible.sort((a, b) => reviewScore(b, type) - reviewScore(a, type))
    return sorted[0] || null
  }

  return null
}

function pickBestStrongCs(candidates, usedIds) {
  const eligible = candidates.filter((agent) => !agent.isRecentlyReviewed)

  if (!eligible.length) return null

  const available = eligible.filter((agent) => !usedIds.has(agent.id))

  if (available.length) {
    const sorted = available.sort((a, b) => strongCsScore(b) - strongCsScore(a))
    usedIds.add(sorted[0].id)
    return sorted[0]
  }

  const sorted = eligible.sort((a, b) => strongCsScore(b) - strongCsScore(a))
  return sorted[0] || null
}

function pickBestStrongGroup(candidates, usedIds, allowSameAgent = true) {
  const eligible = candidates.filter((agent) => !agent.isRecentlyReviewed)

  if (!eligible.length) return null

  const available = eligible.filter((agent) => !usedIds.has(agent.id))

  if (available.length) {
    const sorted = available.sort((a, b) => strongGroupScore(b) - strongGroupScore(a))
    usedIds.add(sorted[0].id)
    return sorted[0]
  }

  if (allowSameAgent) {
    const sorted = eligible.sort((a, b) => strongGroupScore(b) - strongGroupScore(a))
    return sorted[0] || null
  }

  return null
}

export function generatePicks(allRows) {
  const rows = uniqueAgents(allRows.filter((row) => row.isActive))

  return MEETINGS.map((meeting) => {
    if (meeting.summaryOnly) {
      const risky = rows.filter(
        (a) =>
          !a.isRecentlyReviewed &&
          ((a.csScore != null && a.csScore < 90) ||
            (a.groupScore != null && a.groupScore < 85) ||
            a.riskWords)
      )

      return {
        meeting,
        summaryOnly: true,
        riskyCount: risky.length,
        agents: risky.slice(0, 8),
      }
    }

    const centerRows = rows.filter(
      (row) =>
        row.center === meeting.center ||
        (meeting.center === 'BUWELO' && /BU|COLOMBIA|GHANA/i.test(row.sourceSheet))
    )

    const eligibleCenterRows = centerRows.filter((agent) => !agent.isRecentlyReviewed)
    const skippedRecentlyReviewed = centerRows.filter((agent) => agent.isRecentlyReviewed)

    const used = new Set()

    const csReviewCandidates = eligibleCenterRows.filter((a) =>
      a.csScore != null ? a.csScore < 90 : a.riskWords
    )

    const groupAgents = eligibleCenterRows.filter((a) => a.hasGroupCalls || a.groupScore != null)

    const groupReviewCandidates = groupAgents.filter((a) =>
      a.groupScore != null ? a.groupScore < 85 : a.riskWords
    )

    const strongCsCandidates = eligibleCenterRows.filter(
      (a) => a.csScore != null && a.csScore >= 90 && !a.riskWords
    )

    const strongGroupCandidates = groupAgents.filter(
      (a) => a.groupScore != null && a.groupScore >= 85 && !a.riskWords
    )

    const fallbackWorst = eligibleCenterRows
      .filter((a) => !used.has(a.id))
      .sort((a, b) => reviewScore(b, 'cs') - reviewScore(a, 'cs'))

    const fallbackGroupWorst = groupAgents
      .sort((a, b) => reviewScore(b, 'group') - reviewScore(a, 'group'))

    const badCs = pickOne(
      csReviewCandidates.length ? csReviewCandidates : fallbackWorst,
      used,
      'cs',
      false
    )

    const badGroup = meeting.csOnly
      ? null
      : pickOne(
          groupReviewCandidates.length ? groupReviewCandidates : fallbackGroupWorst,
          used,
          'group',
          true
        )

    const goodUsed = new Set(used)

    const bestGoodCs = pickBestStrongCs(
      strongCsCandidates.length ? strongCsCandidates : eligibleCenterRows,
      goodUsed
    )

    const bestGoodGroup = meeting.csOnly
      ? null
      : pickBestStrongGroup(
          strongGroupCandidates.length ? strongGroupCandidates : groupAgents,
          goodUsed,
          true
        )

    const goodAgents = meeting.csOnly
      ? [bestGoodCs].filter(Boolean)
      : [bestGoodCs, bestGoodGroup].filter(Boolean)

    return {
      meeting,
      centerRowsCount: centerRows.length,
      eligibleRowsCount: eligibleCenterRows.length,
      skippedRecentlyReviewedCount: skippedRecentlyReviewed.length,
      badCs,
      badGroup,
      bestGoodCs,
      bestGoodGroup,
      goodAgents,
      notes: [
        skippedRecentlyReviewed.length > 0 &&
          `${skippedRecentlyReviewed.length} agent(s) skipped because they were reviewed in the last ${REVIEW_LOCK_DAYS} days.`,
        !csReviewCandidates.length && 'No clear CS review below 90 found among eligible agents; showing worst eligible option.',
        meeting.csOnly && 'TELUS is CS only. Group pick skipped.',
        !meeting.csOnly &&
          !groupReviewCandidates.length &&
          'No clear Group review below 85 found among eligible group-call agents; showing worst eligible option.',
        badCs &&
          badGroup &&
          badCs.id === badGroup.id &&
          'Same record selected for CS and Group review because this row contains both CS and G scores.',
        bestGoodCs &&
          bestGoodGroup &&
          bestGoodCs.id === bestGoodGroup.id &&
          'Same record selected for strong CS and strong Group example because this row contains both strong CS and G scores.',
        !meeting.csOnly &&
          !bestGoodGroup &&
          'No clear strong Group example found among eligible agents.',
      ].filter(Boolean),
    }
  })
}

export function filterRows(rows, filters) {
  const search = upper(filters.search)

  return rows.filter((row) => {
    if (filters.center !== 'ALL' && row.center !== filters.center) return false
    if (filters.supervisor !== 'ALL' && row.supervisor !== filters.supervisor) return false

    if (filters.performance === 'BAD_CS' && !(row.csScore != null && row.csScore < 90)) {
      return false
    }

    if (filters.performance === 'BAD_GROUP' && !(row.groupScore != null && row.groupScore < 85)) {
      return false
    }

    if (
      filters.performance === 'GOOD' &&
      !(
        (row.csScore == null || row.csScore >= 90) &&
        (row.groupScore == null || row.groupScore >= 85)
      )
    ) {
      return false
    }

    if (!search) return true

    return upper(
      `${row.agentName} ${row.supervisor} ${row.center} ${row.notes} ${row.fullText} ${row.lastReviewLabel}`
    ).includes(search)
  })
}