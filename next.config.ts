import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // the browser softphone needs the microphone, everything else stays off
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["bullmq", "ioredis", "@prisma/client"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Only this authenticated phone document can be framed by its own CRM.
      // Apply to errors/middleware responses too so failures are visible in the phone.
      { source: "/api/sip/widget", headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        { key: "Cache-Control", value: "private, no-store" },
      ] },
    ];
  },
};

export default nextConfig;
