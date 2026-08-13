"use client";

import { useTranslations } from "next-intl";
import { Cormorant } from "next/font/google";
import { Hero } from "./Hero";
// import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { Philosophy } from "./Philosophy";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-landing-serif",
});

interface LandingProps {
  isAuthenticated: boolean;
}

export function Landing({ isAuthenticated }: LandingProps) {
  const t = useTranslations("Landing");
  const tAuth = useTranslations("Auth");
  const ctaHref = isAuthenticated ? "/garden-editor" : "/login";
  const ctaLabel = isAuthenticated ? t("navOpenApp") : tAuth("signIn");

  return (
    <div className={cormorant.variable}>
      {/* <Nav ctaHref={ctaHref} ctaLabel={ctaLabel} /> */}
      <main>
        <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} />
      </main>
    </div>
  );
}
