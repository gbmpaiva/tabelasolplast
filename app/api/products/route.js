import { totvsQuery } from '../../lib/totvs'

const PAGE_SIZE = 20

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code     = (searchParams.get('code') || '').replace(/'/g, "''").trim()
  const tipo     = (searchParams.get('tipo') || '').replace(/'/g, "''").trim()
  const desc     = (searchParams.get('desc') || '').replace(/'/g, "''").trim()
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || String(PAGE_SIZE), 10)))
  const rowMin   = (page - 1) * pageSize + 1
  const rowMax   = page * pageSize

  // ── /api/products?tipos=1  →  distinct B1_TIPO list ──────────────────────
  if (searchParams.get('tipos') === '1') {
    const r = await totvsQuery(
      `SELECT DISTINCT B1_TIPO FROM SB1010
       WHERE D_E_L_E_T_ = ' ' AND B1_TIPO IS NOT NULL AND TRIM(B1_TIPO) <> ' '
       ORDER BY B1_TIPO`
    )
    return Response.json({ success: r.success, data: r.data || [], error: r.error || null })
  }

  // ── Advanced modal search ─────────────────────────────────────────────────
  if (searchParams.has('desc') || searchParams.has('tipo')) {
    const clauses = [`D_E_L_E_T_ = ' '`]

    if (tipo) {
      clauses.push(`TRIM(B1_TIPO) = '${tipo}'`)
    }
    if (desc) {
      const descUp = desc.toUpperCase().replace(/'/g, "''")
      clauses.push(`UPPER(B1_DESC) LIKE '%${descUp}%'`)
    }
    if (code) {
      const codeUp = code.toUpperCase().replace(/'/g, "''")
      clauses.push(`(UPPER(B1_COD) LIKE '%${codeUp}%' OR UPPER(B1_DESC) LIKE '%${codeUp}%')`)
    }

    const where = clauses.join(' AND ')

    // total count for pagination
    const countResult = await totvsQuery(
      `SELECT COUNT(*) AS TOTAL FROM SB1010 WHERE ${where}`
    )
    const total = countResult.success ? (countResult.data?.[0]?.TOTAL ?? 0) : 0

    // paginated rows — Oracle double-ROWNUM trick
    const r = await totvsQuery(
      `SELECT * FROM (
         SELECT t.*, ROWNUM RN FROM (
           SELECT B1_COD, B1_DESC, B1_TIPO, B1_PRV1
           FROM SB1010
           WHERE ${where}
           ORDER BY B1_COD
         ) t WHERE ROWNUM <= ${rowMax}
       ) WHERE RN >= ${rowMin}`
    )

    if (!r.success || !r.data || r.data.length === 0) {
      return Response.json({ success: true, data: [], total: 0, page, pageSize, totalPages: 0, notFound: true })
    }

    const totalPages = Math.ceil(total / pageSize)
    return Response.json({ success: true, data: r.data, total, page, pageSize, totalPages, notFound: false })
  }

  // ── Legacy barcode / code flow (unchanged) ────────────────────────────────
  if (!code) {
    return Response.json({ success: false, data: [], error: 'Informe um código para pesquisar' })
  }

  const exact = await totvsQuery(
    `SELECT B1_COD, B1_DESC, B1_TIPO, B1_PRV1
     FROM SB1010 WHERE TRIM(B1_COD) = '${code}' AND D_E_L_E_T_ = ' '`
  )
  if (exact.success && exact.data.length > 0) {
    return Response.json({ success: true, data: exact.data, notFound: false })
  }

  const codeUp = code.toUpperCase()
  const broad  = await totvsQuery(
    `SELECT * FROM (
       SELECT B1_COD, B1_DESC, B1_TIPO, B1_PRV1
       FROM SB1010
       WHERE D_E_L_E_T_ = ' '
         AND (UPPER(B1_COD) LIKE '%${codeUp}%' OR UPPER(B1_DESC) LIKE '%${codeUp}%')
       ORDER BY B1_COD
     ) WHERE ROWNUM <= 50`
  )

  if (!broad.success || !broad.data || broad.data.length === 0) {
    return Response.json({ success: true, data: [], notFound: true })
  }
  return Response.json({ success: true, data: broad.data, notFound: false })
}