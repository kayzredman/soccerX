import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@soccerx/config",
    "@soccerx/db",
    "@soccerx/types",
    "@soccerx/ui",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default config;
