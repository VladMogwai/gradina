"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";

// enableCssLayer wraps MUI's injected styles in `@layer mui`, which CSS
// layer rules always lose to unlayered styles regardless of specificity or
// source order - so this project's existing SCSS Modules (all unlayered)
// keep overriding MUI defaults exactly as before, letting CssBaseline's
// reset coexist with globals.scss instead of fighting it.
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
