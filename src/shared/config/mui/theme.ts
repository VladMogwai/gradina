import { createTheme } from "@mui/material/styles";

// Mirrors src/shared/styles/_tokens.scss - one light theme only (the app has
// no dark mode; see globals.scss), so this is the sole palette definition.
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#10b981", // $emerald-500
      dark: "#059669", // $emerald-600
    },
    error: {
      main: "#ef4444", // $red-500
      dark: "#dc2626", // $red-600
      light: "#fee2e2", // $red-100
    },
    warning: {
      main: "#b45309", // $amber-700
      light: "#fef3c7", // $amber-100
    },
    info: {
      main: "#0ea5e9", // $sky-500
      dark: "#0369a1", // $sky-700
      light: "#f0f9ff", // $sky-50
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
    },
    background: {
      default: "#f8fafc", // $slate-50
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b", // $slate-800
      secondary: "#64748b", // $slate-500
    },
  },
  shape: {
    borderRadius: 8, // $radius-lg
  },
  typography: {
    // Matches globals.scss's body font-family so MUI chrome and the rest of
    // the app's plain-HTML text render with the same typeface.
    fontFamily: "Arial, Helvetica, sans-serif",
  },
});
