const SftpClient = require('ssh2-sftp-client')

const SFTP_CONFIG = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT),
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASS,
}
const SFTP_BASE_PATH = '/ftp_CSLRBE_development/dev/imgsolplast/'

export default async function handler(req, res) {
  const { cod } = req.query
  if (!cod) return res.status(400).send('Código não informado')

  const sftp = new SftpClient()
  try {
    await sftp.connect(SFTP_CONFIG)
    const remotePath = `${SFTP_BASE_PATH}/${cod}.jpg`
    const exists = await sftp.exists(remotePath)

    if (!exists) {
      return res.status(404).send('Imagem não encontrada')
    }

    const buffer = await sftp.get(remotePath)
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buffer)
  } catch (err) {
    console.error('Erro SFTP:', err.message)
    res.status(500).send('Erro ao buscar imagem')
  } finally {
    await sftp.end()
  }
}