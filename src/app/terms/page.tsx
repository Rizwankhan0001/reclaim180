import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Reclaim 180.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={<p>These terms are the agreement between you and Reclaim 180 when you use the app. Please read them. They&apos;re short.</p>}
    >
      <h2>1. Using Reclaim 180</h2>
      <p>By creating an account or using the app, you agree to these terms and to our <Link href="/privacy">Privacy Policy</Link>.</p>

      <h2>2. You must be 18 or older</h2>
      <p>Reclaim 180 is for adults only. By using it, you confirm that you are at least 18 years old.</p>

      <h2>3. Not medical advice</h2>
      <p>
        Reclaim 180 is a self-tracking tool. It is not a medical, psychological or therapy service. The phase descriptions, tips and
        breathing exercises are general information, not advice for your situation. If you&apos;re struggling, please talk to a doctor or a
        licensed mental health professional. If you&apos;re in crisis or thinking about harming yourself, contact your local emergency
        number right away.
      </p>

      <h2>4. Your account</h2>
      <p>
        Use a real email address you can access, keep your password private, and don&apos;t share your account. You&apos;re responsible for
        what happens under your account. If you think someone else has access, reset your password.
      </p>

      <h2>5. Your content</h2>
      <p>
        What you enter stays yours. You give us permission to store and process it only so we can run the tracker for you. You can
        export or delete it at any time from Settings.
      </p>

      <h2>6. Fair use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>try to access other people&apos;s accounts or data, or get around the app&apos;s security;</li>
        <li>overload, scrape or automate the app, or interfere with how it runs;</li>
        <li>use it for anything illegal.</li>
      </ul>

      <h2>7. The service</h2>
      <p>
        Reclaim 180 is free and provided &quot;as is&quot;. We work to keep it running and your data safe, but we can&apos;t promise it will
        always be available or free of errors, and features may change. We recommend exporting a backup from time to time. If we ever
        decide to shut the service down, we&apos;ll give you notice so you can export your data.
      </p>

      <h2>8. Limits on our responsibility</h2>
      <p>
        To the extent the law allows, Reclaim 180 is not liable for indirect or consequential losses, or for loss of data, arising from
        your use of the app. Nothing in these terms limits rights you have under consumer protection laws that can&apos;t be changed by
        agreement.
      </p>

      <h2>9. Ending your use</h2>
      <p>
        You can stop using Reclaim 180 and delete your account at any time from Settings. We may suspend or close accounts that break
        these terms.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        If we change these terms, we&apos;ll update the date at the top, and tell you in the app about important changes before they take
        effect. If you keep using the app after that, you accept the new terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms: <ContactEmail />.
      </p>
    </LegalPage>
  );
}
