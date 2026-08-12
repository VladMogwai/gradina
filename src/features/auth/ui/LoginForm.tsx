"use client";

import { LanguageSwitcher } from "@/features/locale-switch";
import { createClient } from "@/shared/api/supabase/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 320, margin: "80px auto" }}>
      <LanguageSwitcher />
      <input
        type="email"
        placeholder={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder={t("password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={signIn}>{t("signIn")}</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
