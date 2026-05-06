/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: { fullUrl: true },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
}

export default nextConfig
