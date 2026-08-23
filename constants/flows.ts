import type { FlowCategoryDefinition, FlowDefinition } from "@/types/flow";

/**
 * The categories flows are organized under. This is the single source of
 * truth for category display names — nothing outside this file should
 * hardcode a category label.
 *
 * "manual" groups QA-engineer-created temporary flows (see lib/flows.ts:
 * createManualFlow) so they render and report through the same
 * category-grouped UI as predefined flows, instead of needing special
 * handling downstream.
 */
export const FLOW_CATEGORIES: readonly FlowCategoryDefinition[] = [
  { id: "ui", name: "UI" },
  { id: "studio", name: "Studio" },
  { id: "mission-control", name: "Mission Control" },
  { id: "manual", name: "Manual / Temporary" },
];

/**
 * The predefined flow catalog, grouped by category and nested where a flow
 * naturally decomposes into sub-flows.
 *
 * `id` values are hierarchical, hand-authored, kebab-case paths
 * (`<category>.<parent>.<child>`) chosen for two reasons:
 *  1. Several flow names repeat across categories and nesting levels
 *     (e.g. "Skills", "Theming", "Reports", "Settings", "Default Theme").
 *     A hierarchical id keeps every one of them globally unique without
 *     relying on an opaque generated value.
 *  2. They are readable in raw form (Supabase rows, Slack payloads, logs)
 *     without needing to join back against this file.
 *
 * To add a new flow: append an entry (or a `children` entry) with a unique
 * id. To retire one without breaking historical reports that reference it,
 * set `enabled: false` rather than deleting it.
 */
export const FLOWS: readonly FlowDefinition[] = [
  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  {
    id: "ui.registration-onboard-new-user",
    name: "Registration / Onboard New User",
    category: "ui",
    enabled: true,
  },
  { id: "ui.onboarding-flow", name: "Onboarding Flow", category: "ui", enabled: true },
  { id: "ui.forgot-password-flow", name: "Forgot Password Flow", category: "ui", enabled: true },
  { id: "ui.resume-start-course", name: "Resume / Start Course", category: "ui", enabled: true },
  {
    id: "ui.user-profile-settings",
    name: "User Profile Settings",
    category: "ui",
    enabled: true,
    children: [
      {
        id: "ui.user-profile-settings.instructor-selection",
        name: "Instructor Selection",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.user-profile-settings.user-preference",
        name: "User Preference",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.user-profile-settings.language",
        name: "Language",
        category: "ui",
        enabled: true,
      },
    ],
  },
  { id: "ui.search-flow", name: "Search Flow", category: "ui", enabled: true },
  { id: "ui.skills-lab", name: "Skills Lab", category: "ui", enabled: true },
  { id: "ui.related-courses", name: "Related Courses", category: "ui", enabled: true },
  { id: "ui.bookmark-courses", name: "Bookmark Courses", category: "ui", enabled: true },
  { id: "ui.theming", name: "Theming", category: "ui", enabled: true },
  {
    id: "ui.course-bookmarking-and-list",
    name: "Course Bookmarking and List",
    category: "ui",
    enabled: true,
  },
  { id: "ui.mark-as-incomplete", name: "Mark as Incomplete", category: "ui", enabled: true },
  { id: "ui.retake-course", name: "Retake Course", category: "ui", enabled: true },
  { id: "ui.admin-panel", name: "Admin Panel", category: "ui", enabled: true },
  { id: "ui.translations", name: "Translations", category: "ui", enabled: true },
  {
    id: "ui.course-consumption-flow",
    name: "Course Consumption Flow",
    category: "ui",
    enabled: true,
    children: [
      {
        id: "ui.course-consumption-flow.vivid-mode",
        name: "Vivid Mode",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.ai-enabled-mode",
        name: "AI Enabled Mode",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.basic-mode",
        name: "Basic Mode",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.mic-space",
        name: "Mic (Space)",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.mic-click",
        name: "Mic (Click)",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.history",
        name: "History",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.conversation-archive",
        name: "Conversation Archive",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.simulation-setup",
        name: "Simulation Setup",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.reports",
        name: "Reports",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.avatar-display",
        name: "Avatar Display",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.avatar-speaking",
        name: "Avatar Speaking",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.settings",
        name: "Settings",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.course-completion",
        name: "Course Completion",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.course-consumption-flow.exit-modal",
        name: "Exit Modal",
        category: "ui",
        enabled: true,
      },
    ],
  },
  { id: "ui.course-preview-flow", name: "Course Preview Flow", category: "ui", enabled: true },
  {
    id: "ui.avatar-hierarchy",
    name: "Avatar Hierarchy",
    category: "ui",
    enabled: true,
    children: [
      {
        id: "ui.avatar-hierarchy.asset-level-avatar",
        name: "Asset Level Avatar",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.avatar-hierarchy.user-selected-avatar",
        name: "User Selected Avatar",
        category: "ui",
        enabled: true,
      },
      {
        id: "ui.avatar-hierarchy.organization-avatar",
        name: "Organization Avatar",
        category: "ui",
        enabled: true,
      },
    ],
  },
  { id: "ui.course-assignment", name: "Course Assignment", category: "ui", enabled: true },

  // ---------------------------------------------------------------------
  // Studio
  // ---------------------------------------------------------------------
  {
    id: "studio.new-project-creation",
    name: "New Project Creation",
    category: "studio",
    enabled: true,
    children: [
      {
        id: "studio.new-project-creation.aspect-course",
        name: "Aspect Course",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.new-project-creation.skills-lab",
        name: "Skills Lab",
        category: "studio",
        enabled: true,
        children: [
          {
            id: "studio.new-project-creation.skills-lab.try-me",
            name: "Try Me",
            category: "studio",
            enabled: true,
          },
          {
            id: "studio.new-project-creation.skills-lab.guide-me",
            name: "Guide Me",
            category: "studio",
            enabled: true,
          },
          {
            id: "studio.new-project-creation.skills-lab.mentor-me",
            name: "Mentor Me",
            category: "studio",
            enabled: true,
          },
        ],
      },
      {
        id: "studio.new-project-creation.agentic-mode",
        name: "Agentic Mode",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.new-project-creation.guided-mode",
        name: "Guided Mode",
        category: "studio",
        enabled: true,
      },
    ],
  },
  { id: "studio.course-preview", name: "Course Preview", category: "studio", enabled: true },
  {
    id: "studio.start-resume-view-course",
    name: "Start / Resume / View Course",
    category: "studio",
    enabled: true,
  },
  { id: "studio.retake-course", name: "Retake Course", category: "studio", enabled: true },
  { id: "studio.mark-as-complete", name: "Mark as Complete", category: "studio", enabled: true },
  { id: "studio.complete-course", name: "Complete Course", category: "studio", enabled: true },
  { id: "studio.theming", name: "Theming", category: "studio", enabled: true },
  { id: "studio.search-flow", name: "Search Flow", category: "studio", enabled: true },
  { id: "studio.translations", name: "Translations", category: "studio", enabled: true },
  { id: "studio.skills", name: "Skills", category: "studio", enabled: true },
  { id: "studio.job-roles", name: "Job Roles", category: "studio", enabled: true },
  { id: "studio.search-filters", name: "Search Filters", category: "studio", enabled: true },
  { id: "studio.confirm-setup", name: "Confirm Setup", category: "studio", enabled: true },
  {
    id: "studio.course-consumption-flow",
    name: "Course Consumption Flow",
    category: "studio",
    enabled: true,
    children: [
      {
        id: "studio.course-consumption-flow.vivid-mode",
        name: "Vivid Mode",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.ai-enabled-mode",
        name: "AI Enabled Mode",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.basic-mode",
        name: "Basic Mode",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.mic-space",
        name: "Mic (Space)",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.mic-click",
        name: "Mic (Click)",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.live-chat",
        name: "Live Chat",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.history",
        name: "History",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.conversation-archive",
        name: "Conversation Archive",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.simulation-setup",
        name: "Simulation Setup",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.reports",
        name: "Reports",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.avatar-display",
        name: "Avatar Display",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.avatar-speaking",
        name: "Avatar Speaking",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.settings",
        name: "Settings",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.course-completion",
        name: "Course Completion",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.exit-modal",
        name: "Exit Modal",
        category: "studio",
        enabled: true,
      },
      {
        id: "studio.course-consumption-flow.resources",
        name: "Resources",
        category: "studio",
        enabled: true,
        children: [
          {
            id: "studio.course-consumption-flow.resources.pdf",
            name: "PDF",
            category: "studio",
            enabled: true,
          },
          {
            id: "studio.course-consumption-flow.resources.scorm",
            name: "SCORM",
            category: "studio",
            enabled: true,
          },
          {
            id: "studio.course-consumption-flow.resources.audio",
            name: "Audio",
            category: "studio",
            enabled: true,
          },
          {
            id: "studio.course-consumption-flow.resources.video",
            name: "Video",
            category: "studio",
            enabled: true,
          },
          {
            id: "studio.course-consumption-flow.resources.image",
            name: "Image",
            category: "studio",
            enabled: true,
          },
        ],
      },
      {
        id: "studio.course-consumption-flow.language-change",
        name: "Language Change",
        category: "studio",
        enabled: true,
      },
    ],
  },
  {
    id: "studio.organization-avatars",
    name: "Organization Avatars",
    category: "studio",
    enabled: true,
  },
  { id: "studio.global-avatars", name: "Global Avatars", category: "studio", enabled: true },
  { id: "studio.comments-flow", name: "Comments Flow", category: "studio", enabled: true },

  // ---------------------------------------------------------------------
  // Mission Control
  // ---------------------------------------------------------------------
  {
    id: "mission-control.create-new-course",
    name: "Create New Course",
    category: "mission-control",
    enabled: true,
    children: [
      {
        id: "mission-control.create-new-course.aspect",
        name: "Aspect",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.create-new-course.skills-lab",
        name: "Skills Lab",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.create-new-course.resources",
        name: "Resources",
        category: "mission-control",
        enabled: true,
        children: [
          {
            id: "mission-control.create-new-course.resources.scorm",
            name: "SCORM",
            category: "mission-control",
            enabled: true,
          },
          {
            id: "mission-control.create-new-course.resources.pdf",
            name: "PDF",
            category: "mission-control",
            enabled: true,
          },
          {
            id: "mission-control.create-new-course.resources.audio",
            name: "Audio",
            category: "mission-control",
            enabled: true,
          },
        ],
      },
      {
        id: "mission-control.create-new-course.knowledge-base",
        name: "Knowledge Base",
        category: "mission-control",
        enabled: true,
        children: [
          {
            id: "mission-control.create-new-course.knowledge-base.chunking",
            name: "Chunking",
            category: "mission-control",
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    id: "mission-control.search-filters",
    name: "Search Filters",
    category: "mission-control",
    enabled: true,
  },
  { id: "mission-control.sorting", name: "Sorting", category: "mission-control", enabled: true },
  {
    id: "mission-control.create-organization",
    name: "Create Organization",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.default-theme",
    name: "Default Theme",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.create-employee",
    name: "Create Employee",
    category: "mission-control",
    enabled: true,
  },
  { id: "mission-control.teams", name: "Teams", category: "mission-control", enabled: true },
  {
    id: "mission-control.parent-teams",
    name: "Parent Teams",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.organization-knowledge-base",
    name: "Organization Knowledge Base",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.assignments",
    name: "Assignments",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.branding",
    name: "Branding",
    category: "mission-control",
    enabled: true,
  },
  { id: "mission-control.sso", name: "SSO", category: "mission-control", enabled: true },
  {
    id: "mission-control.audio-models",
    name: "Audio Models",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.avatars",
    name: "Avatars",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.token-consumption",
    name: "Token Consumption",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.studio-token-consumption",
    name: "Studio Token Consumption",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.reports",
    name: "Reports",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.consumption-reports",
    name: "Consumption Reports",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.custom-attributes",
    name: "Custom Attributes",
    category: "mission-control",
    enabled: true,
  },
  { id: "mission-control.skills", name: "Skills", category: "mission-control", enabled: true },
  {
    id: "mission-control.job-roles",
    name: "Job Roles",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.transcription-service",
    name: "Transcription Service",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.studio-project-publish",
    name: "Studio Project Publish",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.comments-flow",
    name: "Comments Flow",
    category: "mission-control",
    enabled: true,
  },
  {
    id: "mission-control.configuration",
    name: "Mission Control Configuration",
    category: "mission-control",
    enabled: true,
    children: [
      {
        id: "mission-control.configuration.bots",
        name: "Bots",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.studio-bots",
        name: "Studio Bots",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.default-avatar",
        name: "Default Avatar",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.delete-avatar",
        name: "Delete Avatar",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.default-audio-model",
        name: "Default Audio Model",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.delete-audio-model",
        name: "Delete Audio Model",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.skills",
        name: "Skills",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.delete-skills",
        name: "Delete Skills",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.interest-translations",
        name: "Interest Translations",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.translations",
        name: "Translations",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.signatures",
        name: "Signatures",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.qr-codes",
        name: "QR Codes",
        category: "mission-control",
        enabled: true,
      },
      {
        id: "mission-control.configuration.default-theme",
        name: "Default Theme",
        category: "mission-control",
        enabled: true,
      },
    ],
  },
];
