import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/getstared',
        destination: '/',
        permanent: false, // 307 Temporary Redirect
      },
      {
        source: '/getstarted',
        destination: '/',
        permanent: false, // 307 Temporary Redirect
      },
    ];
  },
};

export default nextConfig;
