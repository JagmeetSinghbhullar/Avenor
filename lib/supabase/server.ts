import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes the session via Next.js's cookie store, so
 * the session set in middleware.ts is visible here.
 *
 * Server Components can't actually write cookies (Next.js only allows
 * that from Route Handlers/Server Actions), so `setAll` there is a
 * best-effort no-op guarded by try/catch — that's fine as long as
 * middleware.ts is refreshing the session on every request, which is
 * exactly what it does.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — safe to ignore since
            // middleware.ts refreshes the session on every request.
          }
        },
      },
    }
  );
}
