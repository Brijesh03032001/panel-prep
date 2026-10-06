/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  serverExternalPackages: ['pdf-parse', '@libsql/client', 'libsql'],
}

export default nextConfig
