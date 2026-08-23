import { Copy, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildReportText } from "@/features/report/lib/buildReportText";
import type { ReportContent } from "@/types/report";

export interface ReportPreviewProps {
  content: ReportContent;
}

/** Pure render of buildReportText — updates automatically on every re-render, since it's just a function of current props. */
export function ReportPreview({ content }: ReportPreviewProps) {
  const text = buildReportText(content);

  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader
        title="Report Preview"
        description="Exactly what will be sent to Slack"
        icon={<Eye className="h-4.5 w-4.5" strokeWidth={2} />}
        iconClassName="bg-muted text-muted-foreground"
        className="border-b-0 pb-0"
        actions={
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(text)}
            className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            Copy
          </button>
        }
      />
      <pre className="bg-muted/50 text-foreground mt-4 overflow-x-auto rounded-lg p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
    </Card>
  );
}
