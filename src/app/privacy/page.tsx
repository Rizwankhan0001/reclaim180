import type { Metadata } from "next";
import { ContactEmail, LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Reclaim 180 stores, why, who can see it, and how to export or delete it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Reclaim 180 is a private habit and streak tracker. What you write in it is personal, so this page explains in plain words what we
          store, why, who can see it, and how you can take it with you or delete it.
        </p>
      }
    >
      <h2>The short version</h2>
      <ul>
        <li>We store only what the app needs to work: your account and what you enter in your tracker.</li>
        <li>No ads, no analytics or tracking scripts, and we never sell or share your data for marketing.</li>
        <li>You can export everything, erase your tracker, or delete your account from Settings at any time.</li>
      </ul>

      <h2>What we store</h2>
      <ul>
        <li>
          <b>Your account:</b> your email address and, if you give one, your first name. Your password is stored only as a secure,
          one-way hash, so nobody (including us) can read it. If you sign in with Google, we receive your name, email address and
          profile picture link from Google.
        </li>
        <li>
          <b>What you enter in your tracker:</b> your start date and goal, your reasons, your habits, your daily check-ins (habits
          done, mood, energy, urges, urges beaten), your journal notes, any resets you log (time, trigger and note), and your settings.
        </li>
        <li>
          <b>Sign-in sessions:</b> when you sign in, we store a session with your IP address and your browser and device type. This
          keeps you signed in and helps protect your account. Sessions end when you sign out or after 60 days.
        </li>
        <li>
          <b>Security counters:</b> to stop password guessing, we briefly count sign-in and password reset attempts per IP address.
          These counters are deleted automatically within minutes.
        </li>
      </ul>

      <h2>Sensitive information</h2>
      <p>
        Your entries can reveal information about your sexual health and personal habits. You decide what to enter, and you can keep
        notes general if you prefer. We treat all tracker data as sensitive. By creating an account and entering this information,
        you consent to us storing and processing it to provide the tracker. You can withdraw that consent at any time by erasing your
        data or deleting your account.
      </p>

      <h2>How we use it</h2>
      <p>
        Only to run the tracker for you: to show your streak, check-ins and charts, keep you signed in, send password reset emails you
        ask for, and keep the service secure. We don&apos;t look at your entries. The people who run the service can technically access
        the database; we do so only to fix a problem you ask us about, to keep the service secure, or when the law requires it.
      </p>

      <h2>Cookies and browser storage</h2>
      <p>
        We use only essential cookies: one keeps you signed in, and a short-lived one speeds up checking that you&apos;re signed in. The
        app also uses your browser&apos;s storage to remember your theme, tips you&apos;ve dismissed, and check-ins that haven&apos;t
        reached our server yet (for example while you&apos;re offline). This is cleared when you sign out. There are no advertising or
        tracking cookies.
      </p>

      <h2>Services that handle your data</h2>
      <p>We use these providers to run the app. They process data only on our behalf:</p>
      <ul>
        {site.providers.map((p) => (
          <li key={p.name}>
            <b>{p.name}</b> {p.role}.
          </li>
        ))}
      </ul>
      <p>These providers may store or process data in countries other than yours, including the United States.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data until you delete it. In Settings, <b>Erase everything</b> removes your tracker data and <b>Delete account</b>{" "}
        removes your account and everything in it. Deletion takes effect immediately. Copies in our database provider&apos;s backups are
        removed when those backups expire.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>
          <b>See and take your data:</b> Settings, then Export backup, downloads everything as a file.
        </li>
        <li>
          <b>Correct it:</b> edit any day, habit or setting in the app.
        </li>
        <li>
          <b>Delete it:</b> Settings, then Erase everything or Delete account.
        </li>
        <li>
          <b>Anything else:</b> contact us at <ContactEmail />. Depending on where you live, you may also have the right to complain to
          your data protection authority.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Passwords are hashed, connections to the app and to the database are encrypted, and access to the database is limited. No system
        is perfectly secure, so please use a strong password you don&apos;t use anywhere else.
      </p>

      <h2>Age</h2>
      <p>Reclaim 180 is for adults 18 and older. If we learn that someone under 18 has an account, we will delete it.</p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we&apos;ll update the date at the top. For important changes, we&apos;ll also tell you in the app before they
        take effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your data or this policy: <ContactEmail />.
      </p>
    </LegalPage>
  );
}
