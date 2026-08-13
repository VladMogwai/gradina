"use client";

import { LanguageSwitcher } from "@/features/locale-switch";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "../styles/Nav.module.scss";

interface NavProps {
  ctaHref: string;
  ctaLabel: string;
}

export function Nav({ ctaHref, ctaLabel }: NavProps) {
  const t = useTranslations("Landing");
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (
    <>
      <a href="#about" onClick={() => setMenuOpen(false)}>
        {t("navAbout")}
      </a>
      <a href="#philosophy" onClick={() => setMenuOpen(false)}>
        {t("navPhilosophy")}
      </a>
    </>
  );

  return (
    <header className={styles.nav}>
      <div className={styles.bar}>
        <a href="#" className={styles.logo}>
          {t("heroTitle")}
        </a>

        <nav className={styles.links}>{links}</nav>

        <div className={styles.actions}>
          <LanguageSwitcher />
          <a href={ctaHref} className={styles.cta}>
            {ctaLabel}
          </a>
        </div>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-label={t("menuLabel")}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {links}
          <LanguageSwitcher />
          <a href={ctaHref} className={styles.cta} onClick={() => setMenuOpen(false)}>
            {ctaLabel}
          </a>
        </div>
      )}
    </header>
  );
}
