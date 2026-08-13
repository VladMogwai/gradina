"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRevealOnScroll } from "../model/useRevealOnScroll";
import styles from "../styles/Philosophy.module.scss";
import { Eyebrow } from "./Eyebrow";

export function Philosophy() {
  const t = useTranslations("Landing");
  const { ref, visible } = useRevealOnScroll<HTMLElement>();

  return (
    <section id="philosophy" ref={ref} className={`${styles.section} ${visible ? styles.visible : ""}`}>
      <div className={styles.grid}>
        <div className={styles.imageWrap}>
          <Image
            src="/landing/philosophy.jpg"
            alt={t("philosophyImageAlt")}
            width={1600}
            height={2133}
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 480px"
          />
        </div>
        <div className={styles.text}>
          <Eyebrow>{t("philosophyEyebrow")}</Eyebrow>
          <h2 className={styles.heading}>{t("philosophyHeading")}</h2>
          <p className={styles.body}>{t("philosophyBody")}</p>
        </div>
      </div>
    </section>
  );
}
