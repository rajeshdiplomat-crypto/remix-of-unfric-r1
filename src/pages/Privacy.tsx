import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>

        <h1 className="text-2xl font-light uppercase tracking-[0.15em] text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-[11px] text-muted-foreground mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Data We Collect
            </h2>
            <p>
              We collect only what's necessary to provide unfric's features. This includes your email
              address, journal entries, emotion logs, habit records, task data, notes, and manifest
              goals. We follow privacy-by-design principles — minimal data, maximum care.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              How We Use Your Data
            </h2>
            <p>
              Your data is used exclusively to power your personal experience within unfric. We do not
              sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              AI Usage Disclosure
            </h2>
            <p>
              unfric uses AI to provide insights, suggestions, and analysis based on your entries. AI
              processes your journal text, emotion logs, and habit data to generate personalized
              recommendations. AI does not make decisions on your behalf — all outputs are suggestions
              only. Your data is never used to train external AI models.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Data Security
            </h2>
            <p>
              All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. We
              use industry-standard security practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Third-Party Services
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Infrastructure & database hosting (cloud provider)</li>
              <li>Stripe (payment processing, when applicable)</li>
              <li>No analytics or tracking cookies are loaded without your consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Your Rights
            </h2>
            <p>
              You have the right to access, export, correct, and delete your personal data at any time.
              You can exercise these rights through the Settings page in your account. For GDPR
              requests, CCPA requests, or any privacy concerns, contact us at{" "}
              <a href="mailto:privacy@unfric.com" className="text-foreground underline underline-offset-2">
                privacy@unfric.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Do Not Sell My Information
            </h2>
            <p>
              We do not sell your personal information. California residents can exercise their rights
              under the CCPA through the Settings page or by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Data Retention
            </h2>
            <p>
              Your data is retained as long as your account is active. Upon account deletion, all
              personal data is permanently removed from our systems within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Contact
            </h2>
            <p>
              For privacy-related inquiries:{" "}
              <a href="mailto:privacy@unfric.com" className="text-foreground underline underline-offset-2">
                privacy@unfric.com
              </a>
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Operated by the founding team. Not yet incorporated.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
