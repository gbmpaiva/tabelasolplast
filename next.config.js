/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ['ssh2-sftp-client', 'ssh2'],
  },
}

module.exports = nextConfig