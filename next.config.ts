import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n/request.ts");

const nextConfig: NextConfig = {
  // Pins the workspace root explicitly; without this Turbopack's
  // auto-detection can pick up an unrelated lockfile elsewhere on the
  // machine, which was breaking path-alias resolution in the middleware
  // bundle specifically.
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
