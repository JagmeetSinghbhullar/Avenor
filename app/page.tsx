import { FileText, GitBranch, Lock, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCurrentUserStatus } from "@/lib/user-status";

export const metadata: Metadata = {
  title: "Avenor — Personal QA Reporting Dashboard",
  description:
    "Avenor is a QA operations dashboard that syncs your own YouTrack tickets, tracks tested flows, and sends reports to your own Slack — all private to your account.",
};

interface Feature {
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly title: string;
  readonly description: string;
}

const FEATURES: readonly Feature[] = [
  {
    icon: <GoogleIcon />,
    iconClassName: "bg-white ring-1 ring-inset ring-border",
    title: "Google Sign-In",
    description: "Sign in securely with your Google account — no separate password to manage.",
  },
  {
    icon: <GitBranch className="h-4.5 w-4.5" strokeWidth={2} />,
    iconClassName: "bg-sky-50 text-sky-600",
    title: "Connect your own YouTrack account",
    description: "Link your own YouTrack instance and API token, stored encrypted and private to you.",
  },
  {
    icon: <MessageSquare className="h-4.5 w-4.5" strokeWidth={2} />,
    iconClassName: "bg-emerald-50 text-emerald-600",
    title: "Connect your own Slack webhook",
    description: "Send QA reports straight to your own Slack channel through your own webhook.",
  },
  {
    icon: <FileText className="h-4.5 w-4.5" strokeWidth={2} />,
    iconClassName: "bg-orange-50 text-orange-600",
    title: "Create QA reports",
    description: "Track build info, tested flows, and notes, then preview and send a clean report.",
  },
  {
    icon: <Lock className="h-4.5 w-4.5" strokeWidth={2} />,
    iconClassName: "bg-indigo-50 text-indigo-600",
    title: "Sync only your own YouTrack tickets",
    description: "Every sync is scoped to your YouTrack login — you never see another user's tickets, and no one sees yours.",
  },
];

/**
 * The public marketing homepage — required to be reachable without a
 * session (see proxy.ts) for Google's OAuth verification, which rejects
 * an app whose homepage is itself behind a login wall. The authenticated
 * app lives at /dashboard; an already-signed-in visitor is sent straight
 * there so they never see a "Sign in" CTA for an account they're already
 * in.
 */
export default async function HomePage() {
  const status = await getCurrentUserStatus();
  if (status) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-4 sm:px-6">
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
          <Link
            href="/login"
            className="text-primary-subtle-foreground hover:text-primary ml-auto text-sm font-medium transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16 sm:px-6 sm:py-20">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-foreground max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Your personal QA reporting dashboard
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
            Avenor connects to your own YouTrack and Slack accounts, syncs only the tickets that
            belong to you, and helps you build and share clean QA reports — every account
            completely private to the person using it.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-150 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
          >
            <GoogleIcon className="h-5 w-5" />
            Sign in with Google
          </Link>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-foreground text-center text-xl font-semibold tracking-tight">
            Everything scoped to you
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="p-4 sm:p-6">
                <SectionHeader
                  title={feature.title}
                  icon={feature.icon}
                  iconClassName={feature.iconClassName}
                  className="border-b-0 pb-0"
                />
                <p className="text-muted-foreground mt-4 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
