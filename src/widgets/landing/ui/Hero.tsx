"use client";

import { BackgroundVideo } from "@/shared/ui/BackgroundVideo";
import { useTranslations } from "next-intl";
import styles from "../styles/Hero.module.scss";

interface HeroProps {
  ctaHref: string;
  ctaLabel: string;
}

export function Hero({ ctaHref, ctaLabel }: HeroProps) {
  const t = useTranslations("Landing");

  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <h1 className={styles.title}>{t("heroTitle")}</h1>
        <a href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </a>
      </div>

      <div className={styles.right}>
        <BackgroundVideo className={styles.media} />
      </div>
    </section>
  );
}
