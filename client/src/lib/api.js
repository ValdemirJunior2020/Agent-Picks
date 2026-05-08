// client/src/lib/api.js
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL
const API_KEY = import.meta.env.VITE_AGENT_PICKS_API_KEY

export async function fetchAgentRows() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error('Missing VITE_APPS_SCRIPT_URL. Add your deployed Apps Script URL to client/.env')
  }
  const url = new URL(APPS_SCRIPT_URL)
  url.searchParams.set('key', API_KEY || '')
  url.searchParams.set('action', 'all')
  const response = await fetch(url.toString(), { method: 'GET' })
  if (!response.ok) throw new Error(`Apps Script request failed: ${response.status}`)
  const data = await response.json()
  if (!data.success) throw new Error(data.message || 'Apps Script returned an error')
  return data
}
