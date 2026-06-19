import type { NextConfig } from "next";

const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const nextConfig: NextConfig = {
  env: {
    // Override localhost values from imported .env when deployed on Vercel
    AUTH_URL: vercelUrl ?? process.env.AUTH_URL,
    NEXTAUTH_URL: vercelUrl ?? process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
