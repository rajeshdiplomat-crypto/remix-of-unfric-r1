import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Disclaimer() {
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
          Medical Disclaimer
        </h1>
        <p className="text-[11px] text-muted-foreground mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Not Medical Advice
            </h2>
            <p>
              unfric is a personal journaling and emotional wellbeing tool. It is <strong className="text-foreground">not</strong> a
              substitute for professional medical advice, diagnosis, or treatment. The content,
              features, and AI-generated insights provided by unfric are for informational and
              self-reflection purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Not a Replacement for Therapy
            </h2>
            <p>
              unfric is not a therapy platform and does not provide mental health treatment. If you are
              experiencing a mental health crisis, suicidal thoughts, or emotional distress, please
              contact a qualified mental health professional or call your local emergency services
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Emergency Resources
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>National Suicide Prevention Lifeline: 988 (US)</li>
              <li>Crisis Text Line: Text HOME to 741741</li>
              <li>International Association for Suicide Prevention: <a href="https://www.iasp.info/resources/Crisis_Centres/" className="text-foreground underline underline-offset-2" target="_blank" rel="noopener noreferrer">Find a crisis centre</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              AI Limitations
            </h2>
            <p>
              AI-generated insights and suggestions within unfric are based on patterns in your data
              and should not be interpreted as clinical assessments. Always consult a healthcare
              professional for medical or mental health concerns.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-3">
              Your Responsibility
            </h2>
            <p>
              By using unfric, you acknowledge that you are using the platform at your own discretion
              and risk. We encourage you to use unfric as a complement to — not a replacement for —
              professional support.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
