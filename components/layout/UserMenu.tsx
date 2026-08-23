"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
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
          className="bg-primary-subtle text-primary-subtle-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="hidden flex-col leading-tight sm:flex">
        <span className="text-foreground text-sm font-medium">{name}</span>
        <span className="text-muted-foreground text-xs">{email}</span>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        aria-label="Sign out"
        title="Sign out"
        className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors duration-150"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
