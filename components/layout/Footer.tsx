import Link from "next/link";

const FOOTER_LINK_CLASSNAME =
  "text-muted-foreground hover:text-foreground rounded-sm text-sm underline underline-offset-2 outline-none transition-colors duration-150 focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2";

/**
 * Shared footer for the app's public pages (landing, login, legal) — not
 * used inside the authenticated AppShell, which has its own Topbar/Sidebar
 * chrome and no footer today. Links open in the same tab (plain <Link>,
 * no target="_blank") and are reachable regardless of auth state, since
 * /privacy and /terms are excluded from the proxy.ts auth gate.
 */
export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <span className="text-muted-foreground text-sm">© {new Date().getFullYear()} Avenor</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-4">
          <Link href="/privacy" className={FOOTER_LINK_CLASSNAME}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={FOOTER_LINK_CLASSNAME}>
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
