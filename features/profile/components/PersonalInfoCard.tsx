import { User } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export interface PersonalInfoCardProps {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function PersonalInfoCard({ name, email, avatarUrl }: PersonalInfoCardProps) {
  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader
        title="Personal Information"
        icon={<User className="h-4.5 w-4.5" strokeWidth={2} />}
        iconClassName="bg-indigo-50 text-indigo-600"
        className="border-b-0 pb-0"
      />
      <div className="mt-4 flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary-subtle text-primary-subtle-foreground flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-foreground text-base font-semibold">{name}</p>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
      </div>
    </Card>
  );
}
