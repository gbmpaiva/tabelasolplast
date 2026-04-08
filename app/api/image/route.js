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
  const sftp = new SftpClient()
  try {
    await sftp.connect(SFTP_CONFIG)
    const files = await sftp.list(SFTP_BASE_PATH)
    const names = files.map(f => f.name).join(', ')
    return new NextResponse(`Arquivos: ${names}`, { status: 200 })
  } catch (err) {
    return new NextResponse(`Erro: ${err.message}`, { status: 500 })
  } finally {
    await sftp.end()
  }
}