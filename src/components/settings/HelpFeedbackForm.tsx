import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, MessageSquareHeart } from "lucide-react";

const MODULE_OPTIONS = [
  { value: "diary", label: "Diary" },
  { value: "emotions", label: "Emotions" },
  { value: "journal", label: "Journal" },
  { value: "manifest", label: "Manifest" },
  { value: "habits", label: "Habits" },
  { value: "notes", label: "Notes" },
  { value: "tasks", label: "Tasks" },
  { value: "billing", label: "Billing / Account" },
  { value: "general", label: "General" },
];

export function HelpFeedbackForm() {
  const { user } = useAuth();
  const [module, setModule] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = module && message.trim().length > 0 && email.trim().length > 0 && gdprConsent;

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_inquiries" as any).insert({
        user_id: user.id,
        module,
        message: message.trim(),
        user_email: email.trim(),
        gdpr_consent: gdprConsent,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      // toast is optional here since the success state handles it
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="text-base font-light text-foreground">Thank you! We're building Unfric together.</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          If you reported a bug or billing issue, we'll get back to you within 24–48 hours.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            setSubmitted(false);
            setModule("");
            setMessage("");
            setGdprConsent(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Module selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">What do you need help with?</Label>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic…" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tell us more…</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue, idea, or feedback…"
          className="min-h-[120px] resize-y"
          maxLength={2000}
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Your email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {/* GDPR consent */}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="gdpr-consent"
          checked={gdprConsent}
          onCheckedChange={(v) => setGdprConsent(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="gdpr-consent" className="text-xs text-muted-foreground font-light leading-relaxed cursor-pointer">
          I agree to be contacted regarding this message.
        </Label>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full gap-1.5">
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareHeart className="h-3.5 w-3.5" />}
        Submit
      </Button>

      {/* Footer notes */}
      <div className="space-y-1 pt-1">
        <p className="text-[10px] text-muted-foreground/70 text-center">
          By clicking submit, you agree to our privacy policy regarding support requests.
        </p>
        <p className="text-[10px] text-muted-foreground/70 text-center">
          We read every piece of feedback! If you reported a bug or billing issue, we'll get back to you within 24–48 hours.
        </p>
      </div>
    </div>
  );
}
