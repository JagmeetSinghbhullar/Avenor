"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  EmptyState,
  Input,
  LoadingSpinner,
  PageHeader,
  SectionHeader,
  Select,
  Textarea,
} from "@/components/ui";

export default function DevPreviewPage() {
  const [checked, setChecked] = useState(true);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-8">
      <PageHeader
        title="Design System Preview"
        description="Temporary route for visually verifying Feature 2 components. Not part of the app."
        actions={<Button variant="primary">Primary action</Button>}
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Buttons" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Badges" />
        <div className="flex flex-wrap gap-3">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success" dot>
            DEV Verified
          </Badge>
          <Badge variant="warning" dot>
            Staging
          </Badge>
          <Badge variant="danger" dot>
            Blocked
          </Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      <Divider label="Form controls" />

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input label="Build number" placeholder="e.g. 4821" hint="From the CI pipeline" />
        <Input label="Environment" placeholder="staging" error="This field is required" required />
        <Select
          label="Environment"
          options={[
            { label: "Development", value: "development" },
            { label: "Staging", value: "staging" },
            { label: "Production", value: "production" },
          ]}
        />
        <Select label="Disabled select" disabled options={[{ label: "N/A", value: "na" }]} />
        <Textarea
          label="Notes"
          placeholder="Free text notes about today's testing..."
          className="sm:col-span-2"
        />
      </section>

      <section className="flex flex-col gap-3">
        <Checkbox
          label="Course Consumption Flow"
          description="Group flow — indeterminate state shown below"
          indeterminate
        />
        <Checkbox
          label="Vivid Mode"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <Checkbox label="AI Enabled Mode" />
        <Checkbox label="Disabled option" disabled />
        <Checkbox label="With an error" error="Something went wrong" />
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Cards"
          description="Composable Card sub-parts"
          actions={
            <Button size="sm" variant="outline">
              Action
            </Button>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Summary</CardTitle>
            <CardDescription>Aug 23, 2026 — Staging</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            12 flows tested, 4 tickets verified, 2 tickets created.
          </CardContent>
          <CardFooter>
            <Button size="sm">View report</Button>
            <Button size="sm" variant="ghost">
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Empty state" />
        <EmptyState
          title="No reports yet"
          description="Create your first daily QA report to see it here."
          action={<Button size="sm">Create report</Button>}
        />
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Loading spinner" />
        <div className="flex items-center gap-4">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
        </div>
      </section>
    </div>
  );
}
