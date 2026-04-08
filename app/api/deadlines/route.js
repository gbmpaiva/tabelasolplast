import { totvsQuery } from '../../lib/totvs'

export async function GET() {
  const result = await totvsQuery(
    "SELECT E4_CODIGO,E4_COND,E4_DESCRI,E4_XFATOR FROM SE4010 WHERE D_E_L_E_T_ = ' '"
  )
  return Response.json(result)
}
