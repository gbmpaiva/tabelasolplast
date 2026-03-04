/**
 * Shared helper for all TOTVS API calls.
 * Credentials and URL come from environment variables (.env.local).
 */

export const TOTVS_API_URL = process.env.TOTVS_API_URL
export const TOTVS_AUTH = Buffer.from(
  `${process.env.TOTVS_API_USER}:${process.env.TOTVS_API_PASS}`
).toString('base64')

/**
 * Execute a SQL query against the TOTVS REST endpoint.
 * Always returns { success: boolean, data: array, error?: string }
 */
export async function totvsQuery(sql) {
  if (!TOTVS_API_URL) {
    return { success: false, data: [], error: 'TOTVS_API_URL não configurada no .env' }
  }

  try {
    const res = await fetch(TOTVS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${TOTVS_AUTH}`,
      },
      body: JSON.stringify({ LISTA: sql }),
      cache: 'no-store',
    })

    // API always returns 201 — treat non-2xx as error
    if (!res.ok) {
      return { success: false, data: [], error: `HTTP ${res.status}` }
    }

    const json = await res.json()

    // LISTA: [] means no results — not an error
    const data = json.LISTA ?? []
    return { success: true, data }
  } catch (err) {
    return { success: false, data: [], error: err.message }
  }
}
