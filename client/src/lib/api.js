// client/src/lib/api.js

const APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL ||
  import.meta.env.VITE_AGENT_PICKS_API_URL

const API_KEY = import.meta.env.VITE_AGENT_PICKS_API_KEY

export async function fetchAgentRows() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error(
      'Missing Apps Script URL. Add VITE_APPS_SCRIPT_URL or VITE_AGENT_PICKS_API_URL to client/.env and Netlify environment variables.'
    )
  }

  const url = new URL(APPS_SCRIPT_URL)
  url.searchParams.set('key', API_KEY || '')
  url.searchParams.set('action', 'dashboard')

  const response = await fetch(url.toString(), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Apps Script request failed: ${response.status}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || data.message || 'Apps Script returned an error')
  }

  return data
}