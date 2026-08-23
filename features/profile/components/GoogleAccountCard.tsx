import { CheckCircle2 } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export interface GoogleAccountCardProps {
  email: string;
}

export function GoogleAccountCard({ email }: GoogleAccountCardProps) {
  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader
        title="Google Account"
        icon={<GoogleIcon />}
        iconClassName="bg-white ring-1 ring-inset ring-border"
        className="border-b-0 pb-0"
      />
      <div className="border-border mt-4 flex items-center gap-3 rounded-lg border px-4 py-3">
        <CheckCircle2 className="text-success h-5 w-5 shrink-0" strokeWidth={2} />
        <div>
          <p className="text-foreground text-sm font-medium">Connected via Google</p>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
      </div>
    </Card>
  );
}
