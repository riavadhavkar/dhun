/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ hostname: "i.scdn.co" }],
  },
};

export default nextConfig;
