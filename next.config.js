/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ssh2-sftp-client', 'ssh2'],
}

module.exports = nextConfig