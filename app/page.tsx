import { LogoutButton } from "@/features/auth";
import { LanguageSwitcher } from "@/features/locale-switch";
import { createClient } from "@/shared/api/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Auth");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 24 }}>
      <LanguageSwitcher />
      <p>
        {t("loggedInAs")}: {user?.email}
      </p>
      <LogoutButton />
    </main>
  );
}
