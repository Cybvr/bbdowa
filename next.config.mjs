/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/dashboard/creators", destination: "/dashboard/discover", permanent: true },
      { source: "/dashboard/creators/:slug", destination: "/dashboard/discover/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
