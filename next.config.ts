import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["bullmq", "ioredis", "@prisma/client"],
};

export default nextConfig;
