import { useTranslations } from "next-intl";
import type { IdentificationConfidence } from "../model/types";
import styles from "../styles/ConfidenceBadge.module.scss";

const LABEL_KEYS: Record<IdentificationConfidence, string> = {
  low: "confidenceLow",
  medium: "confidenceMedium",
  high: "confidenceHigh",
};

// The abbreviation is localized too, not just translated - the letter has
// to match the word in the current language (H/M/L, R/M/S, В/С/Н).
const LETTER_KEYS: Record<IdentificationConfidence, string> = {
  low: "confidenceLetterLow",
  medium: "confidenceLetterMedium",
  high: "confidenceLetterHigh",
};

interface ConfidenceBadgeProps {
  confidence: IdentificationConfidence;
  className?: string;
}

// Renders AI identification confidence as the low/medium/high enum, never
// a fabricated score - color + a one-letter abbreviation, with the full
// word as the accessible label. No positioning baked in (callers place it
// inline or overlay it themselves via className).
export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const t = useTranslations("Editor");
  const label = t(LABEL_KEYS[confidence]);

  return (
    <div
      className={className ? `${styles.badge} ${className}` : styles.badge}
      data-tier={confidence}
      title={label}
      aria-label={label}
    >
      {/* {t(LETTER_KEYS[confidence])} */}
    </div>
  );
}
