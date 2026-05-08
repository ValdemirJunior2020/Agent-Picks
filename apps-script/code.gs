// apps-script/code.gs
const CONFIG = {
  API_KEY: 'change-this-secret-key',
  SPREADSHEET_ID: '1S5s1m0kWpuSdE0QlMyrUa1sU4ttk71wg83MDHmiro7U',
  SHEETS_TO_READ: [
    'QA Call Center Lists/Score',
    'TEP QA',
    'TELUS',
    'BU W QA',
    'WNS QA',
    'CON QA',
    'Group Only Agents',
    '2024/GrpCalls/Month',
    'ICC QA'
  ],
  MAX_ROWS_PER_SHEET: 1200
}

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {}
    if (CONFIG.API_KEY && params.key !== CONFIG.API_KEY) {
      return json_({ success: false, message: 'Unauthorized request. Invalid API key.' })
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    const requested = String(params.sheet || '').trim()
    const sheets = requested ? [requested] : CONFIG.SHEETS_TO_READ
    const rows = []
    const meta = []

    sheets.forEach((sheetName) => {
      const sheet = ss.getSheetByName(sheetName)
      if (!sheet) {
        meta.push({ sheetName, found: false, rows: 0 })
        return
      }
      const lastRow = Math.min(sheet.getLastRow(), CONFIG.MAX_ROWS_PER_SHEET)
      const lastCol = sheet.getLastColumn()
      if (!lastRow || !lastCol) {
        meta.push({ sheetName, found: true, rows: 0 })
        return
      }
      const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues()
      const backgrounds = sheet.getRange(1, 1, lastRow, lastCol).getBackgrounds()
      const notes = sheet.getRange(1, 1, lastRow, lastCol).getNotes()

      values.forEach((row, idx) => {
        const rowNumber = idx + 1
        const hasData = row.some((cell) => String(cell).trim() !== '')
        if (!hasData) return
        const firstCell = String(row[0] || '').trim()
        if (!firstCell || /^agent\s*name$/i.test(firstCell)) return
        rows.push({
          sheetName,
          rowNumber,
          values: row,
          backgrounds: backgrounds[idx],
          cellNotes: notes[idx],
          agentName: row[0] || '',
          startDate: row[1] || '',
          supervisor: row[2] || '',
          notes: row.slice(4).filter(Boolean).join(' | ')
        })
      })
      meta.push({ sheetName, found: true, rows: rows.filter((r) => r.sheetName === sheetName).length })
    })

    return json_({
      success: true,
      generatedAt: new Date().toISOString(),
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      meta,
      rows
    })
  } catch (err) {
    return json_({ success: false, message: err.message, stack: err.stack })
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
