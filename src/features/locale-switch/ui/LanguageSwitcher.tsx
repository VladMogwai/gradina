"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/shared/config/i18n/actions";

const locales = ["ro", "en", "ru"] as const;

export function LanguageSwitcher() {
  const active = useLocale();
  const t = useTranslations("Common");
  const [pending, startTransition] = useTransition();

  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      {t("language")}:{" "}
      <select
        value={active}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => setLocale(e.target.value))
        }
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
