import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
    const payload: any = {
      consent_type: consentType,
      granted,
      user_agent: navigator.userAgent,
    };
    if (userId) payload.user_id = userId;

    await supabase.from("consent_logs" as any).insert(payload);
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
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 py-2 sm:px-6">
          {!showCustomize ? (
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-muted-foreground flex-1 tracking-wide">
                We use cookies to improve your experience.{" "}
                <button
                  onClick={() => {
                    setShowCustomize(true);
                    setAnalyticsChecked(consent?.analytics ?? false);
                    setMarketingChecked(consent?.marketing ?? false);
                  }}
                  className="text-foreground/70 underline underline-offset-2 hover:text-foreground"
                >
                  Manage
                </button>
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleRejectAll}
                  className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="text-[10px] text-foreground tracking-widest uppercase font-medium hover:opacity-70 transition-opacity"
                >
                  Accept
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-muted-foreground/60 tracking-wide">Essential — always on</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsChecked}
                    onChange={(e) => setAnalyticsChecked(e.target.checked)}
                    className="accent-foreground h-3 w-3"
                  />
                  <span className="text-foreground/80 tracking-wide">Analytics</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingChecked}
                    onChange={(e) => setMarketingChecked(e.target.checked)}
                    className="accent-foreground h-3 w-3"
                  />
                  <span className="text-foreground/80 tracking-wide">Marketing</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCustomize(false);
                    if (forceOpen) {
                      setVisible(false);
                      onClose?.();
                    }
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustom}
                  className="text-[10px] text-foreground tracking-widest uppercase font-medium hover:opacity-70 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
