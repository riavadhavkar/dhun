/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ hostname: "i.scdn.co" }],
  },
  // 127.0.0.1 is required (not localhost) for the Spotify OAuth redirect URI
  // — this silences a dev-only cross-origin warning for that same origin.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
