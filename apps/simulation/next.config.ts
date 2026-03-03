import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@covoiturage/shared",
    "@covoiturage/matching-engine",
    "@covoiturage/geo",
  ],
};

export default nextConfig;
