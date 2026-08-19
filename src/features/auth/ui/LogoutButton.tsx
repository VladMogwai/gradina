"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/shared/api/supabase/client";

// Extracted so other sign-out entry points (e.g. an overflow menu item)
// can trigger the same sign-out without duplicating it or rendering
// LogoutButton's own <button> inside a foreign interactive element.
export function useSignOut() {
  const router = useRouter();
  const supabase = createClient();
  return async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };
}

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps = {}) {
  const t = useTranslations("Auth");
  const signOut = useSignOut();

  return (
    <button onClick={signOut} className={className}>
      {t("signOut")}
    </button>
  );
}
