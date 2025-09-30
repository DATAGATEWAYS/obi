/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          //  CSP:
          // { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' https://telegram.org; frame-src https://oauth.telegram.org" },
        ],
      },
    ];
  },
};

export default nextConfig;