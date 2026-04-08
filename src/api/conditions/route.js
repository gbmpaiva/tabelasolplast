import { totvsQuery } from '../../lib/totvs'

export async function GET() {
  const result = await totvsQuery(
    "SELECT Z02_CODIGO,Z02_DESCRI,Z02_FATOR,Z02_COMISS FROM Z02010 WHERE D_E_L_E_T_ = ' '"
  )
  return Response.json(result)
}
