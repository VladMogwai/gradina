import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const locales = ["ro", "en", "ru"];
const defaultLocale = "en";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;
  const locale =
    cookieLocale && locales.includes(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../../../../messages/${locale}.json`)).default,
  };
});
