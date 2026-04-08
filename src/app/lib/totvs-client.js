/**
 * totvs-client.js
 *
 * Dev local  → chama /api/totvs (proxy Next.js, sem CORS)
 * Protheus   → chama TOTVS_REST_PATH com Basic auth
 */

const TOTVS_REST_PATH = 'http://marinhoe210796.protheus.cloudtotvs.com.br:10657/REST/HVREST/LISTA'

const TOTVS_USER = 'admin'
const TOTVS_PASS = '6JGtD3QE'

// ─── Detecção de ambiente ────────────────────────────────────────────────────
// ESTAVA FALTANDO — causava ReferenceError silencioso em todas as chamadas

// ─── Configuração de request ─────────────────────────────────────────────────
function buildRequest(sql) {
  const body = JSON.stringify({ LISTA: sql })



  const auth = `Basic ${btoa(`${TOTVS_USER}:${TOTVS_PASS}`)}`

  return {
    url: TOTVS_REST_PATH,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body,
    },
  }
}

// ─── Query genérica ──────────────────────────────────────────────────────────
export async function totvsQuery(sql) {
  try {
    const { url, options } = buildRequest(sql)
    const res = await fetch(url, options)

    if (!res.ok) {
      console.error('[TOTVS] HTTP', res.status, url)
      return { success: false, data: [], error: `HTTP ${res.status}` }
    }

    const json = await res.json()
    return { success: true, data: json.LISTA ?? [] }
  } catch (err) {
    console.error('[TOTVS] Erro:', err.message)
    return { success: false, data: [], error: err.message }
  }
}

// ─── Queries específicas ─────────────────────────────────────────────────────
export async function fetchConditions() {
  return totvsQuery(
    "SELECT Z02_CODIGO, Z02_DESCRI, Z02_FATOR, Z02_COMISS FROM Z02010 WHERE D_E_L_E_T_=' ' ORDER BY Z02_DESCRI"
  )
}

export async function fetchDeadlines() {
  return totvsQuery(
    "SELECT E4_CODIGO, E4_COND, E4_DESCRI, E4_XFATOR FROM SE4010 WHERE D_E_L_E_T_=' ' ORDER BY E4_CODIGO"
  )
}

export async function fetchSaleTypes() {
  return totvsQuery(
    "SELECT Z01_CODIGO, Z01_DESCRI, Z01_FATOR FROM Z01010 WHERE D_E_L_E_T_=' ' ORDER BY Z01_DESCRI"
  )
}

export async function fetchProducts(term) {
  const t = (term || '').trim().replace(/'/g, "''")
  if (!t) return { success: true, data: [] }

  return totvsQuery(
    `SELECT B1_COD, B1_DESC, B1_TIPO, B1_PRV1 FROM SB1010` +
    ` WHERE D_E_L_E_T_=' '` +
    ` AND (LTRIM(RTRIM(B1_COD))='${t}'` +
    `   OR LTRIM(RTRIM(B1_CODBAR))='${t}'` +
    `   OR B1_DESC LIKE '%${t}%')` +
    ` ORDER BY B1_COD`
  )
}