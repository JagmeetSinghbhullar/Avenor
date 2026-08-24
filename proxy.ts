import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on every request (required by
 * @supabase/ssr — see lib/supabase/server.ts) and gates every route except
 * the public homepage, the auth pages, the legal pages, Google
 * verification files, and the local dev-preview tool behind a signed-in
 * session. Named `proxy` (not `middleware`) per Next.js 16 — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Touches the session so an expired access token gets refreshed via the
  // refresh token before any Server Component reads it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth/callback");
  // Never committed / not part of the production app — the user's own
  // local component-verification tool, shows no real data.
  const isDevPreview = pathname === "/dev-preview" || pathname.startsWith("/dev-preview/");
  // Static legal pages — required to be publicly reachable without a
  // session for the Google OAuth consent screen, and for Google's own
  // crawler to index them.
  const isLegalPage = pathname === "/privacy" || pathname === "/terms";
  // The public marketing homepage. Google's OAuth verification requires
  // this to be reachable without a session — the authenticated app lives
  // at /dashboard instead. (app/page.tsx redirects an already-signed-in
  // visitor straight to /dashboard, so this only ever actually renders
  // for a signed-out visitor.)
  const isPublicHome = pathname === "/";
  // Google site-ownership verification files (e.g.
  // /google64f569131d515c07.html), served as static files from public/.
  // The matcher below only excludes image extensions, not .html, so
  // these still reach this function — without this check they'd fall
  // through to the redirect just like any other unrecognized path.
  const isGoogleVerificationFile = pathname.startsWith("/google") && pathname.endsWith(".html");

  if (
    !user &&
    !isAuthPage &&
    !isDevPreview &&
    !isLegalPage &&
    !isPublicHome &&
    !isGoogleVerificationFile
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in — don't show the login page again (e.g. after
  // navigating back in browser history).
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
