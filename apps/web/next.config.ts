import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@covoiturage/shared"],
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.npm_package_version ?? "0.0.0",
    NEXT_PUBLIC_APP_COMMIT:
      process.env.NEXT_PUBLIC_APP_COMMIT ??
      process.env.COMMIT_REF ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "local",
    NEXT_PUBLIC_SIMULATION_URL:
      process.env.NEXT_PUBLIC_SIMULATION_URL ?? "http://localhost:3001",
  },
};

export default nextConfig;
