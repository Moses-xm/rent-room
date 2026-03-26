/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async redirects() {
    return [
      // Basic redirect
      {
        source: '/welcome',
        destination: '/manage',
        permanent: true,
      },
    ]
  },
  reactStrictMode: false,
};

export default nextConfig;
