/**
 * Guards against open-redirect attacks via a `next` query param — only a
 * same-origin relative path (starts with "/", not "//") is trusted.
 * Used by both the login page (building the post-auth redirect) and the
 * OAuth callback route (consuming it), so a crafted link like
 * `/login?next=//evil.com` can't hijack the post-login destination.
 *
 * Defaults to /dashboard (the authenticated app), not "/" — "/" is now
 * the public marketing homepage, which isn't where a just-signed-in user
 * should land.
 */
export function getSafeRedirectPath(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}
