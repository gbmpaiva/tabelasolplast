export const runtime = 'nodejs'

import SftpClient from 'ssh2-sftp-client'
import { NextResponse } from 'next/server'

const SFTP_CONFIG = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT),
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASS,
}
const SFTP_BASE_PATH = '/ftp_CSLRBE_development/dev/imgsolplast'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const cod = searchParams.get('cod')
  if (!cod) return new NextResponse('Código não informado', { status: 400 })

  const sftp = new SftpClient()
  try {
    await sftp.connect(SFTP_CONFIG)
    const remotePath = `${SFTP_BASE_PATH}/${cod}.jpg`
    const exists = await sftp.exists(remotePath)
    if (!exists) return new NextResponse('Imagem não encontrada', { status: 404 })

    const buffer = await sftp.get(remotePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    return new NextResponse(`Erro: ${err.message}`, { status: 500 })
  } finally {
    await sftp.end()
  }
}