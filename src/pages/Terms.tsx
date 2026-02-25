import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
          Terms of Service
        </h1>
        <p className="text-[11px] text-muted-foreground mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Acceptance of Terms
            </h2>
            <p>
              By creating an account or using unfric, you agree to these Terms of Service and our
              Privacy Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Use of Service
            </h2>
            <p>
              unfric is a personal journaling and emotional wellbeing platform. You must be at least 18
              years old to use this service. You are responsible for maintaining the security of your
              account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Prohibited Activities
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Scraping, crawling, or automated data extraction</li>
              <li>Reverse engineering, decompiling, or disassembling the service</li>
              <li>Copying, reproducing, or redistributing product logic or design</li>
              <li>Using the service for any unlawful purpose</li>
              <li>Attempting to gain unauthorized access to any systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Intellectual Property
            </h2>
            <p>
              All content, design, code, and functionality of unfric are the exclusive property of
              unfric and are protected by intellectual property laws. You may not copy, modify, or
              create derivative works based on our product logic, design patterns, or proprietary
              features.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Subscriptions & Billing
            </h2>
            <p>
              Some features may require a paid subscription. Subscription terms, pricing, and billing
              cycles will be clearly displayed before purchase. You may cancel your subscription at any
              time through the Settings page — cancellation requires the same effort as signup.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Limitation of Liability
            </h2>
            <p>
              unfric is provided "as is" without warranties of any kind, express or implied. We are not
              liable for any indirect, incidental, special, consequential, or punitive damages arising
              from your use of the service. Our total liability shall not exceed the amount you paid us
              in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Governing Law
            </h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws. Any
              disputes shall be resolved through binding arbitration or in the courts of the applicable
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. We will notify you of significant changes
              via email or in-app notification. Continued use of the service after changes constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Contact
            </h2>
            <p>
              Questions about these terms? Email us at{" "}
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
