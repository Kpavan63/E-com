import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_HOST = supabaseUrl ? new URL(supabaseUrl).hostname : undefined

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds (next build)
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: SUPABASE_HOST ? [SUPABASE_HOST] : [],
    remotePatterns: SUPABASE_HOST
      ? [
          {
            protocol: 'https',
            hostname: SUPABASE_HOST,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
};

export default nextConfig;
