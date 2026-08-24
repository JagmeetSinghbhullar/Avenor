import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * One heading-and-prose section of a legal document. Children are plain
 * <p>/<ul>/<strong> markup — typography is applied here via descendant
 * selectors so the page content itself stays readable prose instead of a
 * className on every paragraph.
 */
export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader title={title} className="border-b-0 pb-0" />
      <div
        className="text-muted-foreground mt-4 flex flex-col gap-3 text-sm leading-relaxed
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-hover
          [&_strong]:text-foreground [&_strong]:font-medium
          [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5 [&_li]:pl-1"
      >
        {children}
      </div>
    </Card>
  );
}
