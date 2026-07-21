// Code.gs
// Google Sheet QA Tracker
// SAFE VERSION:
// - Setup Full QA Tracker does NOT delete Agents Reviewed data.
// - Save button forced to G21/G22.
// - G21 = Save Review / Saving...
// - G22 = clickable checkbox save button.
// - I11 = Custom Notes.
// - I12:I19 = custom notes with short preview + full hover note after 5 seconds.
// - Supports CS and Groups criteria.
// - Reads main review details from C3:C9. C3 is the agent phone start date.
// - Agent Phone Start Date C3 and Today's Date C4 are REQUIRED before saving.
// - C3 allows dates from the last 6 years OR any date in 2026.
// - C4 validates today's actual date using INT(C4)=TODAY().
// - C4 auto-fills today's date when selected/clicked.
// - Loading popup/toast added to setup/fix/load actions.
// - Strong date repair added for C3/C4.
// - Saving part was NOT touched.
// - Evaluator dropdown: Junior / Barbara.
// - C5 Evaluator is NOT cleared after saving.
// - Call Center options: WNS, TEP, Concentrix, Buwelo-G, Buwelo-C, Telus.
// - Call Center accepts lowercase/variations and normalizes automatically.
// - Saves completed review into "Agents Reviwed".

const CONFIG = {
  SOURCE_SHEET_NAME: "Errors Found",
  DESTINATION_SHEET_NAME: "Agents Reviwed",

  SAVE_BUTTON_LABEL_CELL: "G21",
  SAVE_BUTTON_CELL: "G22",

  CUSTOM_NOTES_HEADER_CELL: "I11",
CUSTOM_NOTES_RANGE: "I12:I20",
CUSTOM_NOTES_START_ROW: 12,
CUSTOM_NOTES_END_ROW: 20,
CUSTOM_NOTES_COL: 9,
CUSTOM_NOTES_VISIBLE_CHARS: 8,
CUSTOM_NOTES_PLACEHOLDER: "Your text will turn into notes after 5 seconds once you finish.",
CUSTOM_NOTES_DELAY_MS: 5000,

  OLD_BUTTON_CELLS_TO_CLEAR: ["H1", "I1", "H20", "H21", "I20", "I21", "G20"],

  REVIEW_DATE_CELL: "C3",
  TODAY_DATE_CELL: "C4",
  EVALUATOR_CELL: "C5",
  AGENT_NAME_CELL: "C6",
  CALL_CENTER_CELL: "C7",
  CALL_ID_CELL: "C8",
  QA_TYPE_CELL: "C9",

  FINAL_SCORE_CELL: "F4",
  KPI_TARGET_CELL: "F5",
  RESULT_CELL: "F6",
  MARKDOWNS_CELL: "F7",

  CRITERIA_START_ROW: 12,
  CRITERIA_END_ROW: 20,

  CRITERIA_NUMBER_COL: 2,
  CRITERIA_NAME_COL: 3,
  MAX_POINTS_COL: 4,
  STATUS_COL: 5,
  PARTIAL_POINTS_COL: 6,
  AUTO_POINTS_COL: 7,
  NOTES_COL: 8,

  CLEAR_RANGES_AFTER_SAVE: [
    "C3:C4",
    "C6:C9",
    "E12:E20",
    "F12:F20",
    "H12:H20",
    "I12:I19"
  ]
};

const EVALUATOR_OPTIONS = ["Junior", "Barbara"];
const STATUS_OPTIONS = ["✓ Followed", "✕ Markdown", "N/A", "Partial"];
const QA_TYPE_OPTIONS = ["CS", "Groups"];

const CALL_CENTER_OPTIONS = [
  "WNS",
  "TEP",
  "Concentrix",
  "Buwelo-G",
  "Buwelo-C",
  "Telus"
];

const CS_CRITERIA = [
  {
    number: 1,
    name: "Agent is ready / available to receive call",
    points: 2,
    notes: "Correct greeting/intro; professional tone; sets purpose."
  },
  {
    number: 2,
    name: "Verification",
    points: 8,
    notes: "Confirms first name, last name, itinerary number, hotel name, and booking dates before action."
  },
  {
    number: 3,
    name: "Acknowledges Need / Empathy / Reiteration",
    points: 10,
    notes: "Acknowledges request; restates need; uses empathetic language."
  },
  {
    number: 4,
    name: "Matrix Compliance (Process + Escalation + Tools)",
    points: 20,
    notes: "Follows correct matrix process, tools, escalation path, and timelines."
  },
  {
    number: 5,
    name: "Ownership & Solutioning",
    points: 10,
    notes: "Owns the issue, explains options, asks probing questions, and guides the guest."
  },
  {
    number: 6,
    name: "Efficiency & Expectations",
    points: 10,
    notes: "Sets clear expectations/timeframes, manages hold, and provides updates."
  },
  {
    number: 7,
    name: "Documentation Quality",
    points: 20,
    notes: "Notes are complete, accurate, and aligned with the action taken."
  },
  {
    number: 8,
    name: "Telephone Technique / Communication",
    points: 10,
    notes: "Clear pace, confidence, active listening, call control, and no dead air."
  },
  {
    number: 9,
    name: "Recap & Next Steps",
    points: 10,
    notes: "Summarizes outcome, confirms next step, and closes clearly."
  }
];

const GROUPS_CRITERIA = [
  {
    number: 1,
    name: "Agent is ready to receive call",
    points: 4,
    notes: "Agent begins speaking within 3-5 seconds of being connected to the call."
  },
  {
    number: 2,
    name: "Correct Introduction",
    points: 6,
    notes: "Agent answers using: Thank you for calling Hotel Reservations. My name is ____, how may I assist you?"
  },
  {
    number: 3,
    name: "Acknowledges Guest Request / Reiterates Needs",
    points: 5,
    notes: "Agent shows understanding of the guest's reason for calling, such as creating a room block, booking into an existing block, individual reservation, same-day check-in, or extended stay."
  },
  {
    number: 4,
    name: "Group Request Documentation Accuracy",
    points: 20,
    notes: "Agent captures all requested information and enters it in the correct location on the group request form, including Travel Agent information when applicable, using phonetics to verify email."
  },
  {
    number: 5,
    name: "Honest Representation of HotelPlanner / Partner",
    points: 20,
    notes: "If the guest asks about the agent's location or company, agent answers honestly using the designated group-request verbiage and does not misrepresent the hotel or service."
  },
  {
    number: 6,
    name: "Ownership / Call Control / Guidance",
    points: 15,
    notes: "Agent displays ownership throughout the call by asking leading questions, guiding the guest, and completing the RFP."
  },
  {
    number: 7,
    name: "Telephone Techniques",
    points: 15,
    notes: "Agent is professional, actively listens, avoids speaking over the guest, avoids slang/jargon, uses a clear pace, and avoids dead air."
  },
  {
    number: 8,
    name: "Following Process and Closing Call",
    points: 15,
    notes: "Agent recaps essential details and provides next steps: email within 15 minutes, recommend giving hotels at least 24 hours to respond, provides request ID and password, assists with password if needed, offers further assistance, thanks guest, and allows guest to disconnect first."
  }
];

function showLoading_(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(
    message,
    "QA Tracker - Loading",
    30
  );
  SpreadsheetApp.flush();
}

function showDone_(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(
    message,
    "QA Tracker",
    4
  );
  SpreadsheetApp.flush();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("QA Tracker")
    .addItem("Setup Full QA Tracker SAFE", "setupFullQaTracker")
    .addItem("Setup Save Button", "setupSaveButton")
    .addItem("Setup / Convert Custom Notes", "setupCustomNotes")
    .addItem("Force Criteria Dropdowns", "forceCriteriaDropdowns")
    .addItem("Fix Evaluator Dropdowns", "fixEvaluatorDropdowns")
    .addItem("Fix Call Center Dropdown", "fixCallCenterDropdown")
    .addItem("Fix Date Rules C3/C4", "fixDateRules")
    .addItem("Repair Agents Reviwed Tab - Keep Data", "setupAgentsReviwedTab")
    .addSeparator()
    .addItem("Load CS Criteria", "loadCsCriteria")
    .addItem("Load Groups Criteria", "loadGroupsCriteria")
    .addSeparator()
    .addItem("Save Review Now", "saveReview")
    .addToUi();
}

function onSelectionChange(e) {
  if (!e) return;

  const sheet = e.range.getSheet();
  const cell = e.range.getA1Notation();

  if (sheet.getName() !== CONFIG.SOURCE_SHEET_NAME) return;

  if (cell === CONFIG.TODAY_DATE_CELL) {
    setTodayDate_(sheet);
  }
}

function onEdit(e) {
  if (!e) return;

  const sheet = e.range.getSheet();
  const cell = e.range.getA1Notation();

  if (sheet.getName() !== CONFIG.SOURCE_SHEET_NAME) return;

  if (isCustomNoteCell_(e.range)) {
    handleCustomNoteEdit_(e.range, e.value);
    return;
  }

  if (cell === CONFIG.TODAY_DATE_CELL) {
    forceFixDateCellsNow_(sheet);
    return;
  }

  if (cell === CONFIG.REVIEW_DATE_CELL) {
    forceFixDateCellsNow_(sheet);
    return;
  }

  if (cell === CONFIG.CALL_CENTER_CELL) {
    const normalizedCallCenter = normalizeCallCenter_(e.range.getValue());
    e.range.setValue(normalizedCallCenter);
    return;
  }

  if (cell === CONFIG.QA_TYPE_CELL) {
    const qaType = normalizeQaType_(e.range.getValue());
    e.range.setValue(qaType);
    applyCriteriaByQaType_(sheet, qaType);
    forceCriteriaDropdownsForSheet_(sheet);
    return;
  }

  if (cell === CONFIG.SAVE_BUTTON_CELL && e.value === "TRUE") {
    saveReview();
    resetSaveCheckbox_(sheet);
    sheet.getRange(CONFIG.SAVE_BUTTON_CELL).activate();
  }
}

function setupFullQaTracker() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`);
    return;
  }

  showLoading_("Setting up the full QA Tracker. Please wait...");

  setupSaveButton(false);
  setupCustomNotes(false);
  setupDropdownsAndFormulas_(sheet);
  setupDateRules_(sheet);
  forceCriteriaDropdownsForSheet_(sheet);
  forceCriteriaFormulasForSheet_(sheet);
  fixEvaluatorDropdowns(false);
  fixCallCenterDropdown(false);
  setupAgentsReviwedTab(false);

  showDone_("Full QA Tracker setup is complete.");

  SpreadsheetApp.getUi().alert(
    "Full QA Tracker setup is complete. C3/C4 date rules were fixed. Your Agents Reviwed data was NOT deleted."
  );
}

function fixDateRules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`);
    return;
  }

  showLoading_("Fixing C3/C4 date rules. Please wait...");

  forceFixDateCellsNow_(sheet);

  showDone_("Date rules fixed.");

  SpreadsheetApp.getUi().alert(
    "Date rules fixed. C3 accepts dates from the last 6 years or any date in 2026. C4 has been set to today's date."
  );
}

function setupDateRules_(sheet) {
  forceFixDateCellsNow_(sheet);
}

function forceFixDateCellsNow_(sheet) {
  const c3 = sheet.getRange(CONFIG.REVIEW_DATE_CELL);
  const c4 = sheet.getRange(CONFIG.TODAY_DATE_CELL);

  c3.clearDataValidations();
  c4.clearDataValidations();

  SpreadsheetApp.flush();

  const c3Value = c3.getValue();

  if (c3Value) {
    const convertedC3 = forceDateObject_(c3Value);

    if (convertedC3) {
      c3.setValue(convertedC3);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  c4.setValue(today);

  c3.setNumberFormat("m/d/yyyy");
  c4.setNumberFormat("m/d/yyyy");

  SpreadsheetApp.flush();

  setReviewDateValidation_(sheet);
  setTodayDateValidation_(sheet);
}

function setReviewDateValidation_(sheet) {
  const reviewDateCell = sheet.getRange(CONFIG.REVIEW_DATE_CELL);

  const reviewDateRule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied(
      '=OR(C3="",AND(ISDATE(C3),OR(AND(C3>=EDATE(TODAY(),-72),C3<=TODAY()),AND(C3>=DATE(2026,1,1),C3<=DATE(2026,12,31)))))'
    )
    .setAllowInvalid(false)
    .setHelpText("Start Date must be within the last 6 years or any date in 2026.")
    .build();

  reviewDateCell.clearDataValidations();
  reviewDateCell.setNumberFormat("m/d/yyyy");
  reviewDateCell.setDataValidation(reviewDateRule);
}

function setTodayDateValidation_(sheet) {
  const todayDateCell = sheet.getRange(CONFIG.TODAY_DATE_CELL);

  const todayDateRule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=OR(C4="",AND(ISDATE(C4),INT(C4)=TODAY()))')
    .setAllowInvalid(false)
    .setHelpText("Today's Date must be today's actual date.")
    .build();

  todayDateCell.clearDataValidations();
  todayDateCell.setNumberFormat("m/d/yyyy");
  todayDateCell.setDataValidation(todayDateRule);
}

function setTodayDate_(sheet) {
  const todayDateCell = sheet.getRange(CONFIG.TODAY_DATE_CELL);

  todayDateCell.clearDataValidations();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  todayDateCell.setValue(today);
  todayDateCell.setNumberFormat("m/d/yyyy");

  SpreadsheetApp.flush();

  setTodayDateValidation_(sheet);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Today's date added to C4.",
    "QA Tracker",
    2
  );
}

function forceDateObject_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    value.setHours(0, 0, 0, 0);
    return value;
  }

  const text = String(value || "").trim();
  if (!text) return null;

  const parts = text.split("/");

  if (parts.length === 3) {
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  const parsed = new Date(text);

  if (!isNaN(parsed)) {
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  return null;
}

function setupSaveButton(showAlert = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`);
    return;
  }

  if (showAlert) {
    showLoading_("Setting up the Save Review button. Please wait...");
  }

  CONFIG.OLD_BUTTON_CELLS_TO_CLEAR.forEach(a1 => {
    sheet.getRange(a1)
      .clearContent()
      .clearDataValidations()
      .clearNote()
      .setBackground(null)
      .setFontColor(null)
      .setFontWeight(null);
  });

  sheet.getRange("G21:G22")
    .clearContent()
    .clearDataValidations()
    .clearNote()
    .setBackground(null)
    .setFontColor(null)
    .setFontWeight(null);

  sheet.getRange(CONFIG.SAVE_BUTTON_LABEL_CELL)
    .setValue("Save Review")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#1f4e78")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setNote("When finished reviewing, click the checkbox below in G22.");

  const checkbox = sheet.getRange(CONFIG.SAVE_BUTTON_CELL);
  checkbox.clearContent();
  checkbox.clearDataValidations();
  checkbox.clearNote();

  checkbox.insertCheckboxes();
  checkbox.setValue(false);

  checkbox
    .setBackground("#d9ead3")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setNote("Click this checkbox to save the review into Agents Reviwed.");

  sheet.setColumnWidth(7, 120);
  sheet.setRowHeight(21, 25);
  sheet.setRowHeight(22, 35);

  checkbox.activate();

  if (showAlert) {
    showDone_("Save Review button is ready.");
  }
}

function setSaveUiState_(sheet, isSaving) {
  const labelCell = sheet.getRange(CONFIG.SAVE_BUTTON_LABEL_CELL);

  if (isSaving) {
    labelCell
      .setValue("Saving...")
      .setFontWeight("bold")
      .setFontColor("#000000")
      .setBackground("#facc15")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    SpreadsheetApp.flush();
    return;
  }

  labelCell
    .setValue("Save Review")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#1f4e78")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  SpreadsheetApp.flush();
}

function setupCustomNotes(showAlert = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`);
    return;
  }

  if (showAlert) {
    showLoading_("Setting up Custom Notes. Please wait...");
  }

  sheet.getRange(CONFIG.CUSTOM_NOTES_HEADER_CELL)
    .setValue("Custom Notes")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#374151")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setNote("Type notes below. The cell shows a short preview, and the full note appears when hovering.");

  const notesRange = sheet.getRange(CONFIG.CUSTOM_NOTES_RANGE);

  notesRange
    .setBackground("#fff7ed")
    .setFontSize(9)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(false)
    .setNote(CONFIG.CUSTOM_NOTES_PLACEHOLDER);

  sheet.setColumnWidth(9, 120);

  for (let row = CONFIG.CUSTOM_NOTES_START_ROW; row <= CONFIG.CUSTOM_NOTES_END_ROW; row++) {
    sheet.setRowHeight(row, 50);
  }

  convertExistingCustomNotes_(sheet);

  if (showAlert) {
    showDone_("Custom Notes are ready.");
  }
}

function setupDropdownsAndFormulas_(sheet) {
  const evaluatorRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(EVALUATOR_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  const qaTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(QA_TYPE_OPTIONS, true)
    .setAllowInvalid(true)
    .build();

  const callCenterRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CALL_CENTER_OPTIONS, true)
    .setAllowInvalid(true)
    .build();

  sheet.getRange(CONFIG.EVALUATOR_CELL).clearDataValidations();
  sheet.getRange(CONFIG.QA_TYPE_CELL).clearDataValidations();
  sheet.getRange(CONFIG.CALL_CENTER_CELL).clearDataValidations();

  SpreadsheetApp.flush();

  const currentCallCenter = normalizeCallCenter_(sheet.getRange(CONFIG.CALL_CENTER_CELL).getValue());
  const currentQaType = normalizeQaType_(sheet.getRange(CONFIG.QA_TYPE_CELL).getValue());

  if (currentCallCenter) {
    sheet.getRange(CONFIG.CALL_CENTER_CELL).setValue(currentCallCenter);
  }

  if (currentQaType) {
    sheet.getRange(CONFIG.QA_TYPE_CELL).setValue(currentQaType);
  }

  SpreadsheetApp.flush();

  sheet.getRange(CONFIG.EVALUATOR_CELL).setDataValidation(evaluatorRule);
  sheet.getRange(CONFIG.QA_TYPE_CELL).setDataValidation(qaTypeRule);
  sheet.getRange(CONFIG.CALL_CENTER_CELL).setDataValidation(callCenterRule);

  setupDateRules_(sheet);
  forceCriteriaDropdownsForSheet_(sheet);

  sheet.getRange(CONFIG.FINAL_SCORE_CELL).setFormula("=SUM(G12:G20)");
  sheet.getRange(CONFIG.KPI_TARGET_CELL).setFormula('=IF(LOWER(C9)="groups",85,IF(LOWER(C9)="cs",90,""))');
  sheet.getRange(CONFIG.RESULT_CELL).setFormula('=IF(F4>=F5,"PASS","FAIL")');
  sheet.getRange(CONFIG.MARKDOWNS_CELL).setFormula('=COUNTIF(E12:E20,"✕ Markdown")');

  forceCriteriaFormulasForSheet_(sheet);

  sheet.getRange("D12:D20").setNumberFormat("0");
  sheet.getRange("F12:G20").setNumberFormat("0");
  sheet.getRange("F4:F7").setNumberFormat("0");
}

function fixEvaluatorDropdowns(showAlert = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (showAlert) {
    showLoading_("Fixing Evaluator dropdowns. Please wait...");
  }

  const sourceSheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);
  const reviewedSheet = ss.getSheetByName(CONFIG.DESTINATION_SHEET_NAME);

  const evaluatorRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(EVALUATOR_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  if (sourceSheet) {
    const evaluatorCell = sourceSheet.getRange(CONFIG.EVALUATOR_CELL);
    evaluatorCell.clearDataValidations();

    const currentValue = String(evaluatorCell.getValue() || "").trim();

    if (currentValue === "Junior" || currentValue === "Barbara") {
      evaluatorCell.setValue(currentValue);
    } else if (!currentValue) {
      evaluatorCell.setValue("Junior");
    } else {
      evaluatorCell.setValue("Junior");
    }

    evaluatorCell.setDataValidation(evaluatorRule);
  }

  if (reviewedSheet) {
    const evaluatorRange = reviewedSheet.getRange("D2:D1000");
    evaluatorRange.clearDataValidations();
    evaluatorRange.setDataValidation(evaluatorRule);
  }

  if (showAlert) {
    showDone_("Evaluator dropdown fixed.");

    SpreadsheetApp.getUi().alert(
      "Evaluator dropdown fixed. C5 will stay as Junior or Barbara and will not be cleared after saving."
    );
  }
}

function fixCallCenterDropdown(showAlert = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`);
    return;
  }

  if (showAlert) {
    showLoading_("Fixing Call Center dropdown. Please wait...");
  }

  const callCenterRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CALL_CENTER_OPTIONS, true)
    .setAllowInvalid(true)
    .build();

  const callCenterCell = sheet.getRange(CONFIG.CALL_CENTER_CELL);

  callCenterCell.clearDataValidations();
  SpreadsheetApp.flush();

  const normalized = normalizeCallCenter_(callCenterCell.getValue());

  if (normalized) {
    callCenterCell.setValue(normalized);
  }

  SpreadsheetApp.flush();

  callCenterCell.setDataValidation(callCenterRule);

  if (showAlert) {
    showDone_("Call Center dropdown fixed.");

    SpreadsheetApp.getUi().alert(
      "Call Center dropdown fixed. Allowed values: WNS, TEP, Concentrix, Buwelo-G, Buwelo-C, Telus."
    );
  }
}

function forceCriteriaDropdowns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`);
    return;
  }

  showLoading_("Forcing criteria dropdowns. Please wait...");

  forceCriteriaDropdownsForSheet_(sheet);
  forceCriteriaFormulasForSheet_(sheet);

  showDone_("Criteria dropdowns were forced.");

  SpreadsheetApp.getUi().alert("Dropdowns were forced on E12:E20.");
}

function forceCriteriaDropdownsForSheet_(sheet) {
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(
      CONFIG.CRITERIA_START_ROW,
      CONFIG.STATUS_COL,
      CONFIG.CRITERIA_END_ROW - CONFIG.CRITERIA_START_ROW + 1,
      1
    )
    .setDataValidation(statusRule)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
}

function forceCriteriaFormulasForSheet_(sheet) {
  for (let row = CONFIG.CRITERIA_START_ROW; row <= CONFIG.CRITERIA_END_ROW; row++) {
    sheet.getRange(row, CONFIG.AUTO_POINTS_COL).setFormula(
      `=IF(E${row}="","",IF(OR(E${row}="✓ Followed",E${row}="N/A"),D${row},IF(E${row}="✕ Markdown",0,IF(E${row}="Partial",D${row}/2,0))))`
    );
  }
}

function loadCsCriteria() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SOURCE_SHEET_NAME);
  if (!sheet) return;

  showLoading_("Loading CS criteria. Please wait...");

  sheet.getRange(CONFIG.QA_TYPE_CELL).setValue("CS");
  applyCriteriaByQaType_(sheet, "CS");

  showDone_("CS criteria loaded.");
}

function loadGroupsCriteria() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SOURCE_SHEET_NAME);
  if (!sheet) return;

  showLoading_("Loading Groups criteria. Please wait...");

  sheet.getRange(CONFIG.QA_TYPE_CELL).setValue("Groups");
  applyCriteriaByQaType_(sheet, "Groups");

  showDone_("Groups criteria loaded.");
}

function applyCriteriaByQaType_(sheet, qaType) {
  const normalized = String(qaType || "").trim().toLowerCase();

  if (normalized === "groups") {
    loadCriteriaIntoSheet_(sheet, GROUPS_CRITERIA);
    setupDropdownsAndFormulas_(sheet);
    SpreadsheetApp.getActiveSpreadsheet().toast("Groups criteria loaded. KPI target is 85.", "QA Tracker", 4);
    return;
  }

  if (normalized === "cs") {
    loadCriteriaIntoSheet_(sheet, CS_CRITERIA);
    setupDropdownsAndFormulas_(sheet);
    SpreadsheetApp.getActiveSpreadsheet().toast("CS criteria loaded. KPI target is 90.", "QA Tracker", 4);
    return;
  }
}

function loadCriteriaIntoSheet_(sheet, criteria) {
  const rowCount = CONFIG.CRITERIA_END_ROW - CONFIG.CRITERIA_START_ROW + 1;
  const values = [];

  for (let i = 0; i < rowCount; i++) {
    const item = criteria[i];

    if (item) {
      values.push([
        item.number,
        item.name,
        item.points,
        "",
        "",
        "",
        item.notes
      ]);
    } else {
      values.push(["", "", "", "", "", "", ""]);
    }
  }

  sheet
    .getRange(CONFIG.CRITERIA_START_ROW, CONFIG.CRITERIA_NUMBER_COL, rowCount, 7)
    .setValues(values);

  sheet.getRange("E12:F20").clearContent();

  setupDropdownsAndFormulas_(sheet);
  forceCriteriaDropdownsForSheet_(sheet);
  forceCriteriaFormulasForSheet_(sheet);
  applyCriteriaFormatting_(sheet);
}

function applyCriteriaFormatting_(sheet) {
  sheet.getRange("B11:H11")
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#1f2937")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sheet.getRange("B12:H20")
    .setWrap(true)
    .setVerticalAlignment("middle");

  sheet.getRange("E12:E20").setHorizontalAlignment("center");
  sheet.getRange("D12:D20").setHorizontalAlignment("center");
  sheet.getRange("F12:G20").setHorizontalAlignment("center");

  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 70);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 110);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 420);
  sheet.setColumnWidth(9, 120);

  for (let r = 12; r <= 22; r++) {
    sheet.setRowHeight(r, 50);
  }
}

function setupAgentsReviwedTab(showAlert = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (showAlert) {
    showLoading_("Repairing Agents Reviwed tab. Please wait...");
  }

  const destinationSheet = getOrCreateDestinationSheet_(ss);
  const headers = buildHeaders_();

  const existingFilter = destinationSheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }

  destinationSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatDestinationSheet_(destinationSheet, headers.length);
  fixEvaluatorDropdowns(false);

  if (showAlert) {
    showDone_("Agents Reviwed tab repaired.");

    SpreadsheetApp.getUi().alert(
      `The "${CONFIG.DESTINATION_SHEET_NAME}" tab was repaired. Existing saved data was kept.`
    );
  }
}

function saveReview() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);

  if (!sourceSheet) {
    ss.toast(`Sheet "${CONFIG.SOURCE_SHEET_NAME}" was not found.`, "QA Tracker", 5);
    return;
  }

  ss.toast("Saving review... please wait.", "QA Tracker", 30);
  setSaveUiState_(sourceSheet, true);

  try {
    const destinationSheet = getOrCreateDestinationSheet_(ss);
    ensureHeadersExist_(destinationSheet);

    const reviewData = getReviewData_(sourceSheet);
    const validationMessage = validateReview_(reviewData, sourceSheet);

    if (validationMessage) {
      ss.toast(validationMessage, "QA Tracker", 8);
      resetSaveCheckbox_(sourceSheet);
      return;
    }

    convertExistingCustomNotes_(sourceSheet);
    const customNotes = getCustomNotes_(sourceSheet);
    const rowData = buildSavedRow_(sourceSheet, reviewData, customNotes);
    const nextRow = destinationSheet.getLastRow() + 1;

    destinationSheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    applySavedRowFormatting_(destinationSheet, nextRow, rowData.length);
    applyCustomNotesToSavedRow_(destinationSheet, nextRow, customNotes);

    clearCurrentReview_(sourceSheet);

    ss.toast(`Saved to "${CONFIG.DESTINATION_SHEET_NAME}".`, "QA Tracker", 5);
  } catch (error) {
    ss.toast(`Save failed: ${error.message}`, "QA Tracker", 10);
    SpreadsheetApp.getUi().alert(`Save failed:\n\n${error.message}`);
  } finally {
    setSaveUiState_(sourceSheet, false);
    resetSaveCheckbox_(sourceSheet);
    sourceSheet.getRange(CONFIG.SAVE_BUTTON_CELL).activate();
  }
}

function getReviewData_(sheet) {
  return {
    savedTimestamp: new Date(),
    reviewDate: sheet.getRange(CONFIG.REVIEW_DATE_CELL).getValue(),
    todayDate: sheet.getRange(CONFIG.TODAY_DATE_CELL).getValue(),
    evaluator: sheet.getRange(CONFIG.EVALUATOR_CELL).getValue(),
    agentName: sheet.getRange(CONFIG.AGENT_NAME_CELL).getValue(),
    callCenter: normalizeCallCenter_(sheet.getRange(CONFIG.CALL_CENTER_CELL).getValue()),
    callId: sheet.getRange(CONFIG.CALL_ID_CELL).getValue(),
    qaType: normalizeQaType_(sheet.getRange(CONFIG.QA_TYPE_CELL).getValue()),
    finalScore: sheet.getRange(CONFIG.FINAL_SCORE_CELL).getValue(),
    kpiTarget: sheet.getRange(CONFIG.KPI_TARGET_CELL).getValue(),
    result: sheet.getRange(CONFIG.RESULT_CELL).getValue(),
    markdowns: sheet.getRange(CONFIG.MARKDOWNS_CELL).getValue()
  };
}

function validateReview_(reviewData, sheet) {
  if (!reviewData.reviewDate) return "Please add the Start Date before saving.";
  if (!reviewData.todayDate) return "Please add Today's Date before saving.";
  if (!reviewData.evaluator) return "Please select the Evaluator before saving.";
  if (!reviewData.agentName) return "Please add the Agent Name before saving.";
  if (!reviewData.callCenter) return "Please select the Call Center before saving.";
  if (!reviewData.callId) return "Please add the Call ID before saving.";
  if (!reviewData.qaType) return "Please select the QA Type before saving.";

  const reviewDate = new Date(reviewData.reviewDate);
  const todayDate = new Date(reviewData.todayDate);
  const actualToday = new Date();

  reviewDate.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);
  actualToday.setHours(0, 0, 0, 0);

  const sixYearsAgo = new Date(actualToday);
  sixYearsAgo.setMonth(sixYearsAgo.getMonth() - 72);

  const startOf2026 = new Date(2026, 0, 1);
  const endOf2026 = new Date(2026, 11, 31);

  const reviewDateIsValid =
    (reviewDate >= sixYearsAgo && reviewDate <= actualToday) ||
    (reviewDate >= startOf2026 && reviewDate <= endOf2026);

  if (!reviewDateIsValid) {
    return "Start Date must be within the last 6 years or any date in 2026.";
  }

  if (todayDate.getTime() !== actualToday.getTime()) {
    return "Today's Date must be today's actual date.";
  }

  const validCallCenters = CALL_CENTER_OPTIONS.map(option => option.toLowerCase());
  if (!validCallCenters.includes(String(reviewData.callCenter).toLowerCase())) {
    return "Please use one of these Call Centers: WNS, TEP, Concentrix, Buwelo-G, Buwelo-C, Telus.";
  }

  const statuses = sheet
    .getRange(
      CONFIG.CRITERIA_START_ROW,
      CONFIG.STATUS_COL,
      CONFIG.CRITERIA_END_ROW - CONFIG.CRITERIA_START_ROW + 1,
      1
    )
    .getValues()
    .flat();

  const hasSelection = statuses.some(value => value !== "" && value !== null);

  if (!hasSelection) {
    return "Please select at least one QA criterion before saving.";
  }

  return "";
}

function buildSavedRow_(sheet, reviewData, customNotes) {
  const rowData = [
    reviewData.savedTimestamp,
    reviewData.reviewDate,
    reviewData.todayDate,
    reviewData.evaluator,
    reviewData.agentName,
    reviewData.callCenter,
    reviewData.callId,
    reviewData.qaType,
    reviewData.finalScore,
    reviewData.kpiTarget,
    reviewData.result,
    reviewData.markdowns
  ];

  for (let row = CONFIG.CRITERIA_START_ROW; row <= CONFIG.CRITERIA_END_ROW; row++) {
    rowData.push(sheet.getRange(row, CONFIG.CRITERIA_NUMBER_COL).getValue());
    rowData.push(sheet.getRange(row, CONFIG.CRITERIA_NAME_COL).getValue());
    rowData.push(sheet.getRange(row, CONFIG.MAX_POINTS_COL).getValue());
    rowData.push(sheet.getRange(row, CONFIG.STATUS_COL).getValue());
    rowData.push(sheet.getRange(row, CONFIG.PARTIAL_POINTS_COL).getValue());
    rowData.push(sheet.getRange(row, CONFIG.AUTO_POINTS_COL).getValue());
    rowData.push(sheet.getRange(row, CONFIG.NOTES_COL).getValue());
  }

  customNotes.forEach(note => {
    rowData.push(note.preview);
  });

  return rowData;
}

function buildHeaders_() {
  const headers = [
    "Saved Timestamp",
    "Agent Start Date",
    "Today's Date",
    "Evaluator",
    "Agent Name",
    "Call Center",
    "Call ID",
    "QA Type",
    "Final Score",
    "KPI Target",
    "Result",
    "Markdowns"
  ];

  for (let i = 1; i <= 9; i++) {
    headers.push(`Criteria ${i} #`);
    headers.push(`Criteria ${i} Name`);
    headers.push(`Criteria ${i} Max Points`);
    headers.push(`Criteria ${i} Status`);
    headers.push(`Criteria ${i} Partial Points`);
    headers.push(`Criteria ${i} Auto Points`);
    headers.push(`Criteria ${i} Notes / Issue Found`);
  }

  for (let i = 1; i <= 8; i++) {
    headers.push(`Custom Note ${i}`);
  }

  return headers;
}

function getOrCreateDestinationSheet_(ss) {
  let sheet = ss.getSheetByName(CONFIG.DESTINATION_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.DESTINATION_SHEET_NAME);
  }

  return sheet;
}

function ensureHeadersExist_(sheet) {
  const headers = buildHeaders_();

  if (sheet.getLastRow() === 0 || !sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatDestinationSheet_(sheet, headers.length);
    fixEvaluatorDropdowns(false);
  }
}

function formatDestinationSheet_(sheet, headerLength) {
  sheet.setFrozenRows(1);

  const headerRange = sheet.getRange(1, 1, 1, headerLength);
  headerRange
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#1f4e78")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.getRange(1, 1, sheet.getMaxRows(), headerLength).setWrap(true);

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 160);
  sheet.setColumnWidth(6, 140);
  sheet.setColumnWidth(7, 280);
  sheet.setColumnWidth(8, 100);
  sheet.setColumnWidth(9, 100);
  sheet.setColumnWidth(10, 100);
  sheet.setColumnWidth(11, 100);
  sheet.setColumnWidth(12, 100);

  for (let col = 13; col <= headerLength; col++) {
    sheet.setColumnWidth(col, 160);
  }

  const customNotesStartCol = getCustomNotesStartCol_();

  for (let col = customNotesStartCol; col < customNotesStartCol + 8; col++) {
    sheet.setColumnWidth(col, 110);
  }

  const existingFilter = sheet.getFilter();

  if (!existingFilter) {
    sheet.getRange(1, 1, 1, headerLength).createFilter();
  }
}

function applySavedRowFormatting_(sheet, row, totalColumns) {
  sheet.getRange(row, 1, 1, totalColumns)
    .setVerticalAlignment("middle")
    .setWrap(true);

  const resultCell = sheet.getRange(row, 11);
  const result = String(resultCell.getValue()).toUpperCase();

  if (result === "PASS") {
    resultCell
      .setBackground("#d9ead3")
      .setFontColor("#274e13")
      .setFontWeight("bold");
  }

  if (result === "FAIL") {
    resultCell
      .setBackground("#f4cccc")
      .setFontColor("#990000")
      .setFontWeight("bold");
  }

  const customNotesStartCol = getCustomNotesStartCol_();

  sheet.getRange(row, customNotesStartCol, 1, 8)
    .setBackground("#fff7ed")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(false);
}

function clearCurrentReview_(sheet) {
  CONFIG.CLEAR_RANGES_AFTER_SAVE.forEach(a1 => {
    sheet.getRange(a1).clearContent();
  });

  sheet.getRange(CONFIG.CUSTOM_NOTES_RANGE).clearNote();

  fixEvaluatorDropdowns(false);
  setupDateRules_(sheet);

  resetSaveCheckbox_(sheet);
  sheet.getRange(CONFIG.SAVE_BUTTON_CELL).activate();
}

function resetSaveCheckbox_(sheet) {
  const range = sheet.getRange(CONFIG.SAVE_BUTTON_CELL);

  if (range.isChecked() !== null) {
    range.setValue(false);
  }
}

function isCustomNoteCell_(range) {
  return (
    range.getColumn() === CONFIG.CUSTOM_NOTES_COL &&
    range.getRow() >= CONFIG.CUSTOM_NOTES_START_ROW &&
    range.getRow() <= CONFIG.CUSTOM_NOTES_END_ROW
  );
}

function handleCustomNoteEdit_(range, editedValue) {
  const value = editedValue === undefined || editedValue === null
    ? ""
    : String(editedValue).trim();

  if (!value) {
    range.clearContent();
    range.setNote(CONFIG.CUSTOM_NOTES_PLACEHOLDER);
    return;
  }

  range.setNote(CONFIG.CUSTOM_NOTES_PLACEHOLDER);
  SpreadsheetApp.flush();

  Utilities.sleep(CONFIG.CUSTOM_NOTES_DELAY_MS);

  const currentValue = String(range.getValue() || "").trim();

  if (!currentValue) {
    range.clearContent();
    range.setNote(CONFIG.CUSTOM_NOTES_PLACEHOLDER);
    return;
  }

  const fullNote = currentValue;
  const preview = shortenText_(fullNote);

  range.setNote(fullNote);
  range.setValue(preview);
  range
    .setBackground("#fff7ed")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(false);
}

function convertExistingCustomNotes_(sheet) {
  for (let row = CONFIG.CUSTOM_NOTES_START_ROW; row <= CONFIG.CUSTOM_NOTES_END_ROW; row++) {
    const cell = sheet.getRange(row, CONFIG.CUSTOM_NOTES_COL);
    const value = String(cell.getValue() || "").trim();
    const note = String(cell.getNote() || "").trim();

    if (!value && !note) continue;

    const fullText = note || value;
    const preview = shortenText_(fullText);

    cell.setNote(fullText);
    cell.setValue(preview);
    cell
      .setBackground("#fff7ed")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(false);
  }
}

function getCustomNotes_(sheet) {
  const notes = [];

  for (let row = CONFIG.CUSTOM_NOTES_START_ROW; row <= CONFIG.CUSTOM_NOTES_END_ROW; row++) {
    const cell = sheet.getRange(row, CONFIG.CUSTOM_NOTES_COL);
    const note = cell.getNote();
    const value = cell.getValue();

    const fullText = note || value || "";
    const preview = fullText ? shortenText_(String(fullText)) : "";

    notes.push({
      fullText: String(fullText),
      preview
    });
  }

  return notes;
}

function applyCustomNotesToSavedRow_(sheet, row, customNotes) {
  const startCol = getCustomNotesStartCol_();

  customNotes.forEach((note, index) => {
    const cell = sheet.getRange(row, startCol + index);

    if (note.fullText) {
      cell.setValue(note.preview);
      cell.setNote(note.fullText);
    } else {
      cell.clearContent();
      cell.clearNote();
    }
  });
}

function getCustomNotesStartCol_() {
  return 76;
}

function shortenText_(text) {
  const cleaned = String(text || "").trim();

  if (cleaned.length <= CONFIG.CUSTOM_NOTES_VISIBLE_CHARS) {
    return cleaned;
  }

  return cleaned.substring(0, CONFIG.CUSTOM_NOTES_VISIBLE_CHARS) + "...";
}

function normalizeCallCenter_(value) {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const map = {
    "wns": "WNS",
    "tep": "TEP",
    "concentrix": "Concentrix",
    "telus": "Telus",

    "buwelo-g": "Buwelo-G",
    "buwelo - g": "Buwelo-G",
    "buwelo g": "Buwelo-G",
    "buwelog": "Buwelo-G",
    "buwelo ghana": "Buwelo-G",
    "ghana": "Buwelo-G",

    "buwelo-c": "Buwelo-C",
    "buwelo - c": "Buwelo-C",
    "buwelo c": "Buwelo-C",
    "buweloc": "Buwelo-C",
    "buwelo colombia": "Buwelo-C",
    "colombia": "Buwelo-C"
  };

  return map[cleaned] || value;
}

function normalizeQaType_(value) {
  const cleaned = String(value || "").trim().toLowerCase();

  if (cleaned === "cs" || cleaned === "customer service") return "CS";
  if (cleaned === "groups" || cleaned === "group") return "Groups";

  return value;
}

// -----------------------------------------------------------------------------
// AGENT PICKS WEB API
// -----------------------------------------------------------------------------
// This API is read-only. It exposes only the "Agents Reviwed" tab used by the
// React dashboard. It does not modify the QA form or the saved review data.

const AGENT_PICKS_API_CONFIG = {
  SPREADSHEET_ID: "1GpR3siePgY45jGJfsAB2Q1obCW34A-tfKJOrI8ruEwg",
  SHEET_NAME: "Agents Reviwed",
  API_KEY: "change-this-secret-key",
  CACHE_SECONDS: 60,
  MAX_ROWS: 10000
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const expectedKey = String(AGENT_PICKS_API_CONFIG.API_KEY || "").trim();

    if (expectedKey && String(params.key || "") !== expectedKey) {
      return agentPicksJson_({
        success: false,
        message: "Unauthorized request. Invalid API key."
      });
    }

    const action = String(params.action || "dashboard").trim().toLowerCase();

    if (action !== "dashboard" && action !== "reviews") {
      return agentPicksJson_({
        success: false,
        message: "Unsupported action. Use action=dashboard."
      });
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = "agent-picks-agents-reviewed-v2";
    const cached = cache.get(cacheKey);

    if (cached && String(params.refresh || "") !== "1") {
      return ContentService
        .createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheet = SpreadsheetApp.openById(
      AGENT_PICKS_API_CONFIG.SPREADSHEET_ID
    );
    const sheet = spreadsheet.getSheetByName(
      AGENT_PICKS_API_CONFIG.SHEET_NAME
    );

    if (!sheet) {
      throw new Error(
        `Sheet "${AGENT_PICKS_API_CONFIG.SHEET_NAME}" was not found.`
      );
    }

    const lastRow = Math.min(
      sheet.getLastRow(),
      AGENT_PICKS_API_CONFIG.MAX_ROWS
    );
    const lastColumn = sheet.getLastColumn();

    if (lastRow < 2 || lastColumn < 1) {
      return agentPicksJson_({
        success: true,
        generatedAt: new Date().toISOString(),
        sourceSheet: AGENT_PICKS_API_CONFIG.SHEET_NAME,
        reviews: [],
        meta: {
          reviewRows: 0,
          uniqueAgents: 0,
          csKpi: 90,
          groupsKpi: 85,
          criticalScore: 50,
          specialCorrectionPhoneDays: 60
        }
      });
    }

    const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    const displayValues = sheet
      .getRange(1, 1, lastRow, lastColumn)
      .getDisplayValues();
    const headers = displayValues[0].map(header => String(header || "").trim());
    const headerIndex = buildAgentPicksHeaderIndex_(headers);
    const reviews = [];
    const uniqueAgents = {};

    for (let index = 1; index < values.length; index++) {
      const rowValues = values[index];
      const rowDisplay = displayValues[index];
      const agentName = cleanAgentPicksText_(
        readAgentPicksColumn_(rowDisplay, headerIndex, ["Agent Name"])
      );

      if (!agentName) continue;

      const score = agentPicksNumber_(
        readAgentPicksColumn_(rowValues, headerIndex, ["Final Score"])
      );
      const qaType = normalizeQaType_(
        readAgentPicksColumn_(rowDisplay, headerIndex, ["QA Type"])
      );

      if (score === null || !qaType) continue;

      const callCenter = normalizeCallCenter_(
        readAgentPicksColumn_(rowDisplay, headerIndex, ["Call Center"])
      );
      const agentStartValue = readAgentPicksColumn_(
        rowValues,
        headerIndex,
        ["Agent Start Date", "Start Date", "Review Date"]
      );
      const reviewDateValue = readAgentPicksColumn_(
        rowValues,
        headerIndex,
        ["Today's Date", "Review Completed Date"]
      );
      const savedTimestampValue = readAgentPicksColumn_(
        rowValues,
        headerIndex,
        ["Saved Timestamp"]
      );

      const issueSummary = buildAgentPicksIssueSummary_(
        headers,
        rowDisplay,
        headerIndex
      );

      const review = {
        id: `agents-reviewed-${index + 1}`,
        rowNumber: index + 1,
        savedTimestamp: agentPicksDateIso_(savedTimestampValue, true),
        agentStartDate: agentPicksDateIso_(agentStartValue, false),
        reviewDate: agentPicksDateIso_(
          reviewDateValue || savedTimestampValue,
          false
        ),
        evaluator: cleanAgentPicksText_(
          readAgentPicksColumn_(rowDisplay, headerIndex, ["Evaluator"])
        ),
        agentName: agentName,
        callCenter: cleanAgentPicksText_(callCenter),
        callId: cleanAgentPicksText_(
          readAgentPicksColumn_(rowDisplay, headerIndex, ["Call ID"])
        ),
        qaType: qaType,
        finalScore: score,
        kpiTarget: qaType === "Groups" ? 85 : 90,
        result: score >= (qaType === "Groups" ? 85 : 90) ? "PASS" : "FAIL",
        markdowns: agentPicksNumber_(
          readAgentPicksColumn_(rowValues, headerIndex, ["Markdowns"])
        ) || 0,
        issueSummary: issueSummary
      };

      reviews.push(review);
      uniqueAgents[`${String(callCenter).toLowerCase()}|${agentName.toLowerCase()}`] = true;
    }

    const payload = {
      success: true,
      generatedAt: new Date().toISOString(),
      spreadsheetId: AGENT_PICKS_API_CONFIG.SPREADSHEET_ID,
      sourceSheet: AGENT_PICKS_API_CONFIG.SHEET_NAME,
      reviews: reviews,
      meta: {
        reviewRows: reviews.length,
        uniqueAgents: Object.keys(uniqueAgents).length,
        csKpi: 90,
        groupsKpi: 85,
        criticalScore: 50,
        specialCorrectionPhoneDays: 60,
        startDateSource: "C3 saved to Agent Start Date / legacy Review Date column",
        reviewDateSource: "C4 saved to Today's Date column"
      }
    };

    const json = JSON.stringify(payload);

    // Apps Script cache entries have a size limit. Large QA histories should
    // still return normally even when they are too large to cache.
    if (json.length < 90000) {
      try {
        cache.put(cacheKey, json, AGENT_PICKS_API_CONFIG.CACHE_SECONDS);
      } catch (cacheError) {
        // Cache failure must never block the dashboard response.
      }
    }

    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return agentPicksJson_({
      success: false,
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : ""
    });
  }
}

function buildAgentPicksHeaderIndex_(headers) {
  const index = {};

  headers.forEach((header, position) => {
    const normalized = String(header || "").trim().toLowerCase();
    if (normalized && index[normalized] === undefined) {
      index[normalized] = position;
    }
  });

  return index;
}

function readAgentPicksColumn_(row, headerIndex, names) {
  for (let i = 0; i < names.length; i++) {
    const position = headerIndex[String(names[i]).trim().toLowerCase()];
    if (position !== undefined) return row[position];
  }

  return "";
}

function cleanAgentPicksText_(value) {
  return String(value === null || value === undefined ? "" : value)
    .trim()
    .replace(/\s+/g, " ");
}

function agentPicksNumber_(value) {
  if (value === "" || value === null || value === undefined) return null;

  const number = Number(String(value).replace("%", "").trim());
  return isFinite(number) ? number : null;
}

function agentPicksDateIso_(value, includeTime) {
  if (!value) return "";

  let date = value;

  if (Object.prototype.toString.call(value) !== "[object Date]") {
    date = new Date(value);
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) return "";

  if (includeTime) return date.toISOString();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildAgentPicksIssueSummary_(headers, row, headerIndex) {
  const issues = [];

  for (let criteria = 1; criteria <= 9; criteria++) {
    const status = cleanAgentPicksText_(
      readAgentPicksColumn_(
        row,
        headerIndex,
        [`Criteria ${criteria} Status`]
      )
    );
    const name = cleanAgentPicksText_(
      readAgentPicksColumn_(
        row,
        headerIndex,
        [`Criteria ${criteria} Name`]
      )
    );
    const note = cleanAgentPicksText_(
      readAgentPicksColumn_(
        row,
        headerIndex,
        [`Criteria ${criteria} Notes / Issue Found`]
      )
    );

    if (/markdown|partial/i.test(status)) {
      issues.push([name, status, note].filter(Boolean).join(" - "));
    }
  }

  headers.forEach((header, position) => {
    if (!/^Custom Note \d+$/i.test(String(header || ""))) return;

    const customNote = cleanAgentPicksText_(row[position]);
    if (customNote) issues.push(customNote);
  });

  return issues.join(" | ");
}

function agentPicksJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
