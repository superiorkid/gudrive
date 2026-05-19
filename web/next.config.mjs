/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: { fullUrl: true },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
    ],
    qualities: [75, 80],
  },
}

export default nextConfig
