/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: "/backstab/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
        }/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
