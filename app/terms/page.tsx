import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export const metadata: Metadata = {
  title: "Terms of Service — Avenor",
  description:
    "The terms governing your use of Avenor, a QA reporting platform with per-user YouTrack and Slack integrations.",
};

const LAST_UPDATED = "August 24, 2026";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <LegalSection title="Acceptance of Terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Avenor
          (&quot;Avenor&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By signing in
          with Google or otherwise using Avenor, you agree to be bound by these Terms. If you do
          not agree, do not use the service.
        </p>
      </LegalSection>

      <LegalSection title="Description of the Service">
        <p>Avenor is a QA operations dashboard that allows a signed-in user to:</p>
        <ul>
          <li>Sign in securely using their Google account.</li>
          <li>Connect their own YouTrack account to sync only their own tickets.</li>
          <li>Connect their own Slack Incoming Webhook to send QA reports.</li>
          <li>Build and preview QA reports covering tested flows, build info, and notes.</li>
          <li>Store user-specific integration settings, securely and separately per account.</li>
        </ul>
        <p>
          Every user&apos;s data — reports, integrations, and synced tickets — is private to that
          user, and Avenor does not use one user&apos;s connected credentials on another
          user&apos;s behalf.
        </p>
      </LegalSection>

      <LegalSection title="User Responsibilities">
        <ul>
          <li>You are responsible for maintaining the security of your Google account used to sign in.</li>
          <li>
            You are responsible for the accuracy and validity of any YouTrack API token or Slack
            webhook URL you provide, and for ensuring you are authorized to use them.
          </li>
          <li>You agree not to use Avenor to access, or attempt to access, another user&apos;s data.</li>
          <li>
            You agree not to misuse the service, including attempting to interfere with its
            normal operation or circumvent its security controls.
          </li>
          <li>You are responsible for the content of the QA reports you create and send.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Third-party Integrations">
        <p>
          Avenor integrates with Google, Supabase, YouTrack, and Slack to provide its
          functionality. Your use of those third-party services, through Avenor or otherwise, is
          also governed by their own terms of service. We are not responsible for the
          availability, accuracy, or content of any third-party service, including any YouTrack
          instance or Slack workspace you connect.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          Avenor and its original content, features, and design are owned by us and protected by
          applicable intellectual property laws. These Terms do not grant you any right to use our
          branding, trademarks, or source code outside of your ordinary use of the service. QA
          report content you create remains yours.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          Avenor is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of
          any kind, whether express or implied. To the fullest extent permitted by law, we are not
          liable for any indirect, incidental, or consequential damages arising from your use of
          the service, including data loss, or from the unavailability or misconfiguration of any
          third-party service (Google, Supabase, YouTrack, or Slack) you connect to Avenor.
        </p>
      </LegalSection>

      <LegalSection title="Service Availability">
        <p>
          We aim to keep Avenor available and reliable, but we do not guarantee uninterrupted
          access. The service may be temporarily unavailable for maintenance, updates, or reasons
          outside our control, including outages of the third-party services it depends on.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we make material changes, we will
          update the &quot;Last Updated&quot; date at the top of this page. Continued use of
          Avenor after changes take effect constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact Information">
        <p>
          If you have questions about these Terms, contact us at{" "}
          <a href="mailto:jagmeetsingh5677@gmail.com">jagmeetsingh5677@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
