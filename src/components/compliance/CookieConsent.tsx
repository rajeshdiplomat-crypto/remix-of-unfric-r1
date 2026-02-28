import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";

const CONSENT_KEY = "unfric_cookie_consent";

interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
}

function getStoredConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

async function logConsent(
  userId: string | null,
  consentType: string,
  granted: boolean
) {
  try {
    await supabase.functions.invoke("manage-settings", {
      body: {
        action: "submit_consent",
        consentType,
        granted,
        userAgent: navigator.userAgent
      }
    });
  } catch {
    // Silently fail — consent logging is best-effort
  }
}

export function CookieConsent({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [visible, setVisible] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);

    // Respect Global Privacy Control
    const gpc = (navigator as any).globalPrivacyControl;
    if (gpc && !stored) {
      // Auto-reject non-essential
      const autoReject: ConsentState = { analytics: false, marketing: false, decided: true };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(autoReject));
      setConsent(autoReject);
      logConsent(user?.id ?? null, "cookies_analytics", false);
      logConsent(user?.id ?? null, "cookies_marketing", false);
      return;
    }

    if (!stored) {
      // Small delay before showing
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (forceOpen) {
      const stored = getStoredConsent();
      setAnalyticsChecked(stored?.analytics ?? false);
      setMarketingChecked(stored?.marketing ?? false);
      setShowCustomize(true);
      setVisible(true);
    }
  }, [forceOpen]);

  const saveConsent = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const state: ConsentState = { analytics, marketing, decided: true };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
      setConsent(state);
      setVisible(false);
      onClose?.();

      const uid = user?.id ?? null;
      logConsent(uid, "cookies_analytics", analytics);
      logConsent(uid, "cookies_marketing", marketing);
    },
    [user, onClose]
  );

  const handleAcceptAll = () => saveConsent(true, true);
  const handleRejectAll = () => saveConsent(false, false);
  const handleSaveCustom = () => saveConsent(analyticsChecked, marketingChecked);

  if (!visible && !forceOpen) return null;
  if (consent?.decided && !forceOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          {!showCustomize ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
                We use cookies to improve your experience. No tracking cookies are loaded without your
                consent.{" "}
                <button
                  onClick={() => {
                    setShowCustomize(true);
                    setAnalyticsChecked(consent?.analytics ?? false);
                    setMarketingChecked(consent?.marketing ?? false);
                  }}
                  className="text-foreground underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1"
                >
                  <Settings2 className="h-3 w-3" /> Customize
                </button>
              </p>
              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  className="flex-1 sm:flex-none text-xs uppercase tracking-wider"
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none text-xs uppercase tracking-wider"
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Choose which cookies you'd like to allow:
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-not-allowed opacity-60">
                  <input type="checkbox" checked disabled className="accent-foreground" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Essential</p>
                    <p className="text-[10px] text-muted-foreground">Required for the app to function. Always enabled.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsChecked}
                    onChange={(e) => setAnalyticsChecked(e.target.checked)}
                    className="accent-foreground"
                  />
                  <div>
                    <p className="text-xs text-foreground font-medium">Analytics</p>
                    <p className="text-[10px] text-muted-foreground">
                      Help us understand how you use unfric to improve the experience.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingChecked}
                    onChange={(e) => setMarketingChecked(e.target.checked)}
                    className="accent-foreground"
                  />
                  <div>
                    <p className="text-xs text-foreground font-medium">Marketing</p>
                    <p className="text-[10px] text-muted-foreground">
                      Allow personalized content and communications.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomize(false);
                    if (forceOpen) {
                      setVisible(false);
                      onClose?.();
                    }
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveCustom} className="text-xs uppercase tracking-wider">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
