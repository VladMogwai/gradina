import { createServerClient } from "@supabase/ssr";
// Deep imports instead of the "next/server" barrel: that barrel eagerly
// requires next/dist/compiled/ua-parser-js (for the unused userAgent
// export), which references the bare __dirname global at module scope.
// Vercel's edge middleware packaging doesn't tree-shake unused barrel
// exports the way a bundler does, so that reference executes on every
// request and crashes (there's no __dirname in the edge runtime).
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import type { NextRequest } from "next/dist/server/web/spec-extension/request";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session cookie; the single route at "/" decides for
  // itself what to render based on auth state, so there's nothing to
  // redirect here.
  await supabase.auth.getUser();

  return response;
}
