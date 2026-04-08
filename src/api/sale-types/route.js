import { totvsQuery } from '../../app/lib/totvs'

export async function GET() {
  const result = await totvsQuery(
    "SELECT Z01_CODIGO,Z01_DESCRI,Z01_FATOR FROM Z01010 WHERE D_E_L_E_T_ = ' '"
  )
  return Response.json(result)
}
