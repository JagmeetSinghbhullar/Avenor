/**
 * Guards against open-redirect attacks via a `next` query param — only a
 * same-origin relative path (starts with "/", not "//") is trusted.
 * Used by both the login page (building the post-auth redirect) and the
 * OAuth callback route (consuming it), so a crafted link like
 * `/login?next=//evil.com` can't hijack the post-login destination.
 */
export function getSafeRedirectPath(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}
