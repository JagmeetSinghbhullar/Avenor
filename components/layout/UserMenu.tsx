"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface UserMenuProps {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function UserMenu({ name, email, avatarUrl }: UserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/profile"
        className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors duration-150 hover:bg-muted"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-subtle-foreground"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        aria-label="Sign out"
        title="Sign out"
        className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
