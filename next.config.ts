import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n/request.ts");

// Derived from the configured Supabase URL rather than hardcoded, so this
// stays correct if the project URL ever changes (e.g. a staging project).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Scoped to this one project's PUBLIC storage path - not a wildcard
    // that would let the optimizer proxy any Supabase project or any
    // non-public endpoint.
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    qualities: [75],
    // Objects are immutable (a unique uuid path per upload, never rewritten
    // in place - see plantPhotoApi.ts), so optimized variants can be held
    // for a year instead of the 60s default.
    minimumCacheTTL: 31536000,
  },
};

export default withNextIntl(nextConfig);
