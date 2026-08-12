"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/shared/api/supabase/client";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <button onClick={signOut}>{t("signOut")}</button>;
}
