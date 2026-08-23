import { Settings2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ENVIRONMENT_OPTIONS } from "@/constants/environments";
import type { Environment } from "@/types/report";

export interface BuildInfoFormProps {
  buildNumber: string;
  onBuildNumberChange: (value: string) => void;
  environment: Environment | "";
  onEnvironmentChange: (value: Environment | "") => void;
}

export function BuildInfoForm({
  buildNumber,
  onBuildNumberChange,
  environment,
  onEnvironmentChange,
}: BuildInfoFormProps) {
  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader
        title="Build Information"
        icon={<Settings2 className="h-4.5 w-4.5" strokeWidth={2} />}
        iconClassName="bg-indigo-50 text-indigo-600"
        className="border-b-0 pb-0"
      />
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Build Number"
          required
          value={buildNumber}
          onChange={(event) => onBuildNumberChange(event.target.value)}
          placeholder="e.g. 4.6821"
        />
        <Select
          label="Environment"
          required
          value={environment}
          onChange={(event) => onEnvironmentChange(event.target.value as Environment | "")}
        >
          <option value="">Select environment...</option>
          {ENVIRONMENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  );
}
