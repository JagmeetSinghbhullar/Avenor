import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

export interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Shared shell for the public, unauthenticated legal pages (/privacy,
 * /terms). These are reachable without a session (see proxy.ts) and live
 * entirely outside the authenticated AppShell — no sidebar/topbar, since
 * there's no user context to show — so this is its own minimal header
 * instead, reusing the same brand mark as the login page.
 */
export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-foreground text-sm font-semibold tracking-tight">Avenor</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader title={title} description={`Last Updated: ${lastUpdated}`} />
        {children}
        <nav aria-label="Legal pages" className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Terms of Service
          </Link>
        </nav>
      </main>
    </div>
  );
}
