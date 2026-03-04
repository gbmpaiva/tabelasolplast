import { totvsQuery } from '../../lib/totvs'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = (searchParams.get('code') || '').replace(/'/g, "''").trim()

  if (!code) {
    return Response.json({ success: false, data: [], error: 'Informe um código para pesquisar' })
  }

  // Try exact match first (by B1_COD — the primary key used in the example)
  const exactResult = await totvsQuery(
    `SELECT B1_COD, B1_DESC, B1_TIPO, B1_PRV1 FROM SB1010 WHERE B1_COD = '${code}' AND D_E_L_E_T_ = ' '`
  )

  // If exact match found, return it
  if (exactResult.success && exactResult.data.length > 0) {
    return Response.json({ success: true, data: exactResult.data, notFound: false })
  }

  // Fallback: broad search by code prefix or description (for the search modal)
  const broadResult = await totvsQuery(
    `SELECT TOP 50 B1_COD, B1_DESC, B1_TIPO, B1_PRV1 FROM SB1010 WHERE D_E_L_E_T_ = ' ' AND (B1_COD LIKE '%${code}%' OR B1_DESC LIKE '%${code}%') ORDER BY B1_COD`
  )

  // LISTA: [] — product not found in either search
  if (!broadResult.success || broadResult.data.length === 0) {
    return Response.json({ success: true, data: [], notFound: true })
  }

  return Response.json({ success: true, data: broadResult.data, notFound: false })
}