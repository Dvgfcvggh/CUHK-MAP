import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone pages load through a Cloudflare quick tunnel, which is a different origin.
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
