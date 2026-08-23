import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/components/layout/UserMenu";

export interface TopbarUser {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface TopbarProps {
  /** null when signed out. Route protection (a later step) will make this always non-null on the dashboard. */
  user: TopbarUser | null;
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="border-border bg-surface flex h-14 shrink-0 items-center gap-2.5 border-b px-4 md:px-6">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <BadgeCheck className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="text-foreground text-base font-semibold tracking-tight">Avenor</span>
      <div className="ml-auto">
        {user ? (
          <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
        ) : (
          <Link
            href="/login"
            className="text-primary-subtle-foreground hover:text-primary text-sm font-medium transition-colors duration-150"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
