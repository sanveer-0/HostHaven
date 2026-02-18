/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Use the deployed backend URL in production, fallback to localhost for dev
    const backendBase = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
