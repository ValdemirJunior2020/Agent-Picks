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

function normalize(value) {
  return String(value ?? '').trim()
}

function upper(value) {
  return normalize(value).toUpperCase()
}

export function inferCenter(sheetName = '', row = {}) {
  const source = `${sheetName} ${Object.values(row).join(' ')}`.toUpperCase()

  const match = CENTER_ALIASES.find((item) =>
    item.patterns.some((pattern) => source.includes(pattern))
  )

  return match?.center || upper(sheetName).replace(' QA', '').replace('CALL CENTER', '').trim() || 'UNKNOWN'
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

  const weekMatch = text.match(/W\s*(\d+)/i)

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
    /(?:^|\s)(?:G|GRP|GROUP)\s*[/:>-]*\s*(\d{1,3})\s*%?/i,
    /(\d{1,3})\s*%?\s*(?:G|GRP|GROUP)(?:\s|$)/i,
  ]

  const hasGroupCalls =
    /(?:^|\s)(G|GRP|GROUP)\s*[/:>-]*/i.test(text) ||
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

      const notes = normalize(
        row.notes ||
          row.Notes ||
          row.Comments ||
          values.slice(4).join(' | ')
      )

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

      const riskWords =
        /(needs work|question|schedule|ts|terrible|low|markdown|bad|fail|coaching|refund|not follow|escalat)/i.test(
          fullText
        )

      const isActive = !/(inactive|terminated|resigned|left company)/i.test(fullText)

      return {
        id: `${sheetName}-${row.rowNumber || index + 1}`,
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
        reviewFlags,
        fullText,
        values,
        dateWeek,
        isActive,
        riskWords,
      }
    })
    .filter((row) => row.agentName && !/^agent\s*name$/i.test(row.agentName))
}

function riskScore(agent, type = 'cs') {
  const value = type === 'group' ? agent.groupScore : agent.csScore
  const threshold = type === 'group' ? 85 : 90

  let score = value == null ? 25 : Math.max(0, threshold - value) * 10

  if (agent.riskWords) score += 35
  if (agent.hasGroupCalls && type === 'group') score += 20

  if (agent.dateWeek.date) {
    const ageDays = Math.max(0, (Date.now() - agent.dateWeek.date.getTime()) / 86400000)
    score += Math.max(0, 45 - Math.min(45, ageDays / 2))
  }

  if (agent.reviewFlags) score += 8

  return score
}

function goodCsScore(agent) {
  const cs = agent.csScore ?? -1
  let score = cs

  if (agent.csScore != null && agent.csScore >= 90) score += 50
  if (agent.groupScore != null && agent.groupScore >= 85) score += 10
  if (agent.riskWords) score -= 30
  if (agent.reviewFlags) score += 5

  return score
}

function goodGroupScore(agent) {
  const group = agent.groupScore ?? -1
  let score = group

  if (agent.hasGroupCalls) score += 40
  if (agent.groupScore != null && agent.groupScore >= 85) score += 50
  if (agent.csScore != null && agent.csScore >= 90) score += 10
  if (agent.riskWords) score -= 30
  if (agent.reviewFlags) score += 5

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

  const availablePool = candidates.filter((a) => !usedIds.has(a.id))

  if (availablePool.length) {
    const sorted = availablePool.sort((a, b) => riskScore(b, type) - riskScore(a, type))
    usedIds.add(sorted[0].id)
    return sorted[0]
  }

  if (allowUsedIfNeeded) {
    const sorted = candidates.sort((a, b) => riskScore(b, type) - riskScore(a, type))
    return sorted[0] || null
  }

  return null
}

function pickBestGoodCs(candidates, usedIds) {
  if (!candidates.length) return null

  const available = candidates.filter((agent) => !usedIds.has(agent.id))

  if (available.length) {
    const sorted = available.sort((a, b) => goodCsScore(b) - goodCsScore(a))
    usedIds.add(sorted[0].id)
    return sorted[0]
  }

  const sorted = candidates.sort((a, b) => goodCsScore(b) - goodCsScore(a))
  return sorted[0] || null
}

function pickBestGoodGroup(candidates, usedIds, allowSameAgent = true) {
  if (!candidates.length) return null

  const available = candidates.filter((agent) => !usedIds.has(agent.id))

  if (available.length) {
    const sorted = available.sort((a, b) => goodGroupScore(b) - goodGroupScore(a))
    usedIds.add(sorted[0].id)
    return sorted[0]
  }

  if (allowSameAgent) {
    const sorted = candidates.sort((a, b) => goodGroupScore(b) - goodGroupScore(a))
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
          (a.csScore != null && a.csScore < 90) ||
          (a.groupScore != null && a.groupScore < 85) ||
          a.riskWords
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

    const used = new Set()

    const badCsCandidates = centerRows.filter((a) =>
      a.csScore != null ? a.csScore < 90 : a.riskWords
    )

    const groupAgents = centerRows.filter((a) => a.hasGroupCalls || a.groupScore != null)

    const badGroupCandidates = groupAgents.filter((a) =>
      a.groupScore != null ? a.groupScore < 85 : a.riskWords
    )

    const goodCsCandidates = centerRows.filter(
      (a) => a.csScore != null && a.csScore >= 90 && !a.riskWords
    )

    const goodGroupCandidates = groupAgents.filter(
      (a) => a.groupScore != null && a.groupScore >= 85 && !a.riskWords
    )

    const fallbackWorst = centerRows
      .filter((a) => !used.has(a.id))
      .sort((a, b) => riskScore(b, 'cs') - riskScore(a, 'cs'))

    const fallbackGroupWorst = groupAgents
      .sort((a, b) => riskScore(b, 'group') - riskScore(a, 'group'))

    const badCs = pickOne(
      badCsCandidates.length ? badCsCandidates : fallbackWorst,
      used,
      'cs',
      false
    )

    const badGroup = meeting.csOnly
      ? null
      : pickOne(
          badGroupCandidates.length ? badGroupCandidates : fallbackGroupWorst,
          used,
          'group',
          true
        )

    const goodUsed = new Set(used)

    const bestGoodCs = pickBestGoodCs(
      goodCsCandidates.length ? goodCsCandidates : centerRows,
      goodUsed
    )

    const bestGoodGroup = meeting.csOnly
      ? null
      : pickBestGoodGroup(
          goodGroupCandidates.length ? goodGroupCandidates : groupAgents,
          goodUsed,
          true
        )

    const goodAgents = meeting.csOnly
      ? [bestGoodCs].filter(Boolean)
      : [bestGoodCs, bestGoodGroup].filter(Boolean)

    return {
      meeting,
      centerRowsCount: centerRows.length,
      badCs,
      badGroup,
      bestGoodCs,
      bestGoodGroup,
      goodAgents,
      notes: [
        !badCsCandidates.length && 'No clear CS < 90 found; showing worst available.',
        meeting.csOnly && 'TELUS is CS only. Group pick skipped.',
        !meeting.csOnly &&
          !badGroupCandidates.length &&
          'No clear Group < 85 found; showing worst available group-call agent.',
        badCs &&
          badGroup &&
          badCs.id === badGroup.id &&
          'Same agent selected for bad CS and bad Group because this row contains both CS and G scores.',
        bestGoodCs &&
          bestGoodGroup &&
          bestGoodCs.id === bestGoodGroup.id &&
          'Same agent selected for best CS and best Group because this row contains both strong CS and G scores.',
        !meeting.csOnly &&
          !bestGoodGroup &&
          'No clear good Group agent found.',
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
      `${row.agentName} ${row.supervisor} ${row.center} ${row.notes} ${row.fullText}`
    ).includes(search)
  })
}