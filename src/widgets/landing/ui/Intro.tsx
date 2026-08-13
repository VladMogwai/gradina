"use client";

import { useTranslations } from "next-intl";
import { useRevealOnScroll } from "../model/useRevealOnScroll";
import styles from "../styles/Intro.module.scss";
import { Eyebrow } from "./Eyebrow";

export function Intro() {
  const t = useTranslations("Landing");
  const { ref, visible } = useRevealOnScroll<HTMLElement>();

  const stats = [
    { label: t("stat1Label"), value: t("stat1Value"), note: t("stat1Note") },
    { label: t("stat2Label"), value: t("stat2Value"), note: t("stat2Note") },
    { label: t("stat3Label"), value: t("stat3Value"), note: t("stat3Note") },
  ];

  return (
    <section id="about" ref={ref} className={`${styles.section} ${visible ? styles.visible : ""}`}>
      <div className={styles.inner}>
        <Eyebrow>{t("introEyebrow")}</Eyebrow>
        <h2 className={styles.heading}>{t("introHeading")}</h2>
        <p className={styles.body}>{t("introBody")}</p>

        <dl className={styles.stats}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.stat}>
              <dt>{stat.label}</dt>
              <dd className={styles.value}>{stat.value}</dd>
              <dd className={styles.note}>{stat.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
