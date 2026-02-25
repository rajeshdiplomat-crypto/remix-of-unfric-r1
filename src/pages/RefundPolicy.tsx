import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
          Refund Policy
        </h1>
        <p className="text-[11px] text-muted-foreground mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Subscription Refunds
            </h2>
            <p>
              If you're not satisfied with your subscription, you may request a refund within 7 days
              of your initial purchase or renewal. Refunds are processed to the original payment method
              within 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              How to Request a Refund
            </h2>
            <p>
              To request a refund, email us at{" "}
              <a href="mailto:privacy@unfric.com" className="text-foreground underline underline-offset-2">
                privacy@unfric.com
              </a>{" "}
              with your account email and reason for the request. We aim to respond within 48 hours.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Cancellation
            </h2>
            <p>
              You can cancel your subscription at any time through the Settings page. Your access
              continues until the end of the current billing period. No partial refunds are provided
              for unused time after the 7-day refund window.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Exceptions
            </h2>
            <p>
              We may grant refunds outside the standard policy at our discretion for exceptional
              circumstances such as billing errors or service unavailability.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
