import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile outside the repo can't be
  // inferred as the project root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
