# Update Notes

## New data source

The React app reads only the `Agents Reviwed` tab from Google Sheet ID:

`1GpR3siePgY45jGJfsAB2Q1obCW34A-tfKJOrI8ruEwg`

All old multi-sheet agent-source parsing was removed.

## Score rules

- CS average below 90%: exposed.
- Groups average below 85%: exposed.
- Any average below 50%: critical exposure.
- Average below 50% plus at least 60 days on the phones: Special Correction.
- Averages are calculated separately for CS and Groups across all saved reviews.

## Start date

`Errors Found!C3` is the agent phone start date. The existing save flow stores it in column B of `Agents Reviwed`. The updated header is `Agent Start Date`, while the API still supports the previous `Review Date` header.

## Weekly picks

The existing weekly QA meeting schedule remains. Each call center receives below-KPI picks based on the calculated averages, plus strong examples when available.

## Removed

- Old source tab list and note-based score parsing
- Old review-rotation and nesting logic
- Hardcoded probation agents
- Music player component
- `music.mp3`

## Validation

- `npm ci` passed using the official npm registry.
- `npm run build` passed with Vite 8.0.11.
- Apps Script file passed JavaScript syntax validation.
- Workbook fixture test grouped 19 review rows into 11 unique agents and calculated the expected averages.
