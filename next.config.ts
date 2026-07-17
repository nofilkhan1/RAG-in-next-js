import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@lancedb/lancedb"],
  turbopack: {},
};

export default nextConfig;
