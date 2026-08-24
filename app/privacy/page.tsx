import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export const metadata: Metadata = {
  title: "Privacy Policy — Avenor",
  description:
    "How Avenor collects, uses, and protects your data, including Google account information and your connected YouTrack and Slack integrations.",
};

const LAST_UPDATED = "August 24, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="Introduction">
        <p>
          Avenor (&quot;Avenor&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a QA
          reporting platform that lets quality assurance engineers sign in with Google, connect
          their own YouTrack and Slack accounts, and generate and share QA reports. This Privacy
          Policy explains what information we collect, how we use it, and the choices you have.
        </p>
        <p>
          By creating an account or otherwise using Avenor, you agree to the collection and use of
          information as described in this policy.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect">
        <p>
          Avenor is designed to store only what is necessary to operate your personal dashboard.
          We do not collect analytics, advertising, or tracking data.
        </p>
        <p>
          <strong>Google account information.</strong> When you sign in with Google, we receive
          your name, email address, and profile picture from Google, which we use to create and
          identify your Avenor account.
        </p>
        <p>
          <strong>YouTrack configuration.</strong> If you choose to connect YouTrack, we store the
          YouTrack instance URL, project, YouTrack login, optional custom state field name, and
          your YouTrack API token. The API token is encrypted at rest and is never displayed back
          to you or any other user after it is saved.
        </p>
        <p>
          <strong>Slack webhook configuration.</strong> If you choose to connect Slack, we store
          the Incoming Webhook URL you provide. Like your YouTrack API token, it is encrypted at
          rest and never displayed back to you after it is saved.
        </p>
        <p>
          <strong>QA report data.</strong> Reports you create — build numbers, environments,
          tested flows, notes, and the YouTrack ticket references pulled into a report — are
          stored so you can review your report history and so in-progress drafts can be restored
          the next time you sign in.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <ul>
          <li>To authenticate you and maintain your personal, isolated dashboard.</li>
          <li>
            To sync tickets from your own YouTrack account that are assigned to, or reported by,
            your YouTrack login — never tickets belonging to any other user.
          </li>
          <li>To generate and send QA reports to your connected Slack channel, at your request.</li>
          <li>To save and restore your in-progress report drafts across sessions.</li>
          <li>To operate, maintain, and troubleshoot the service.</li>
        </ul>
        <p>We do not sell your information, and we do not use it for advertising.</p>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <p>Avenor relies on the following third-party services to operate:</p>
        <ul>
          <li>
            <strong>Google OAuth.</strong> Used solely to authenticate you. We receive only the
            basic profile information described above.
          </li>
          <li>
            <strong>Supabase.</strong> Our database and authentication provider. Your account
            data, report data, and encrypted integration credentials are stored in a Supabase
            project we operate.
          </li>
          <li>
            <strong>YouTrack.</strong> If you connect YouTrack, Avenor communicates directly with
            your own YouTrack instance, using your own API token, to read your tickets.
          </li>
          <li>
            <strong>Slack.</strong> If you connect Slack, Avenor sends report messages to the
            Incoming Webhook URL you provide, only when you choose to send a report.
          </li>
        </ul>
        <p>
          Each of these services has its own privacy policy governing how it handles data on its
          platform.
        </p>
      </LegalSection>

      <LegalSection title="Data Storage & Security">
        <p>
          All data is stored in Supabase, with row-level security enabled so that a user can only
          ever access their own data — no user can read or modify another user&apos;s reports,
          integrations, or profile information.
        </p>
        <p>
          Your YouTrack API token and Slack webhook URL are stored using encrypted secret storage
          (Supabase Vault) rather than as plain text, and are only decrypted, server-side, at the
          moment they are needed to sync tickets or send a report. They are never sent to, or
          accessible from, your browser after you save them.
        </p>
      </LegalSection>

      <LegalSection title="User Rights">
        <p>You can, at any time:</p>
        <ul>
          <li>View and update your connected YouTrack and Slack integrations from your Profile page.</li>
          <li>Disconnect YouTrack or Slack, which removes the stored credentials immediately.</li>
          <li>Request a copy of the data associated with your account.</li>
          <li>Request deletion of your account and associated data.</li>
        </ul>
        <p>To request a data export or account deletion, contact us using the details below.</p>
      </LegalSection>

      <LegalSection title="Data Retention">
        <p>
          We retain your account, integration, and report data for as long as your account remains
          active. If you request account deletion, your data is removed within a reasonable period
          thereafter, except where retention is required to comply with a legal obligation.
        </p>
      </LegalSection>

      <LegalSection title="Contact Information">
        <p>
          If you have questions about this Privacy Policy or how your data is handled, contact us
          at{" "}
          <a href="mailto:jagmeetsingh5677@gmail.com">jagmeetsingh5677@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
