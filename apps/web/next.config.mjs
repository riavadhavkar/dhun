import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This web app lives in a monorepo and its env lives at the repo root
// (`../../.env`). Next only auto-loads `.env` from its own directory, and
// Docker injects the vars via `env_file`, so when running `npm run dev` /
// `build` / `start` directly from `apps/web` we load the root file ourselves.
// Only fills in keys that aren't already set (so Docker/CI env always wins).
try {
  const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../../.env");
  for (const line of readFileSync(rootEnv, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    process.env[key] = value;
  }
} catch {
  // No root .env (e.g. inside the Docker image) — nothing to load.
}

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
