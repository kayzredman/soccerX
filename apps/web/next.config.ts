import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@soccerx/config",
    "@soccerx/db",
    "@soccerx/types",
    "@soccerx/ui",
  ],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
