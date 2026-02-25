

# Compliance, Legal & Security Layer for Unfric

This is a large, multi-phase implementation. Given the scope, I recommend breaking it into **3 phases** to keep things manageable and shippable. Here is the full plan.

---

## Phase 1: Legal Pages + Settings Enhancements + Age Gate

### 1.1 New Pages (Static Legal Content)

Create four new route pages, all following the existing Zara-inspired minimal aesthetic (max-w-2xl, uppercase tracking headers, light font weights):

- **`/privacy`** — Privacy Policy page
  - Data collected (minimal: email, journal entries, emotions, habits, tasks, notes, manifest goals)
  - AI usage disclosure (transparent: what data, how decisions are made)
  - Vendor list (Stripe, infrastructure providers)
  - Contact: privacy@unfric.com
  - "Operated by [Founder Name], not yet incorporated"

- **`/terms`** — Terms of Service
  - No scraping / reverse engineering clause
  - Subscription terms placeholder
  - Governing law clause
  - Liability disclaimer
  - IP clause: no copying product logic

- **`/refund`** — Refund Policy (simple, short)

- **`/disclaimer`** — Medical Disclaimer
  - Not medical advice, not therapy replacement

All pages will be **public routes** (no auth required), added to `App.tsx` routes.

### 1.2 Footer Component

Create a minimal **`LegalFooter`** component rendered inside `AppLayout` below `<main>`:
- "© 2025 unfric — All rights reserved"
- Links: Privacy · Terms · Cookie Settings
- Render on all authenticated pages

### 1.3 Auth Page Updates

- Add **18+ age confirmation checkbox** on the signup form
- Block form submission if not checked
- Add links to Privacy Policy and Terms of Service below the signup button
- Small text: "By creating an account, you agree to our Terms and Privacy Policy"

### 1.4 Settings Page — New "Legal & Privacy" Section

Add a new collapsible section in Settings with icon `Scale` (from lucide):
- Link to Privacy Policy
- Link to Terms of Service  
- Link to Refund Policy
- Link to Medical Disclaimer
- Cookie Settings button (opens consent manager)
- "Do Not Sell My Info" toggle (for CCPA)

### 1.5 Account Deletion — Backend Implementation

Create an edge function **`delete-account`** that:
- Verifies the user's auth token
- Deletes all user data from every table (emotions, journal_entries, journal_answers, habits, habit_completions, notes, note_folders, note_groups, tasks, focus_sessions, manifest_goals, manifest_journal, manifest_practices, feed_events, feed_comments, feed_reactions, feed_saves, hero_media, journal_prompts, journal_settings, user_settings, profiles)
- Calls `supabase.auth.admin.deleteUser(userId)` to remove the auth record
- Logs the deletion request timestamp
- Returns success

Update the Settings delete account dialog to:
- Require typing "DELETE" to confirm
- Call the edge function
- Sign out on success

---

## Phase 2: Consent Management + Consent Logging

### 2.1 Database — New Table

**`consent_logs`** table:
- `id` (uuid, PK)
- `user_id` (uuid, nullable — for anonymous cookie consent)
- `consent_type` (text — "cookies_analytics", "cookies_marketing", "do_not_sell", "age_verification", "terms_accepted")
- `granted` (boolean)
- `ip_country` (text, nullable)
- `user_agent` (text, nullable)
- `created_at` (timestamptz)

RLS: Users can read own consent logs. Insert allowed for authenticated users.

### 2.2 Cookie Consent Banner

Create a **`CookieConsent`** component:
- Shown at bottom of screen (not a popup — a slim bar)
- "Accept All" and "Reject All" buttons with **equal visual weight**
- "Customize" link to expand categories (Analytics, Marketing)
- Persisted to localStorage + logged to `consent_logs` table
- Respects **Global Privacy Control** (GPC) — check `navigator.globalPrivacyControl`
- If GPC is true, auto-reject non-essential cookies
- No tracking scripts loaded before consent
- "Cookie Settings" button in footer re-opens this

### 2.3 Consent Logging

Every consent action (cookie accept/reject, age confirmation, DNSMPI toggle) writes an immutable row to `consent_logs`.

---

## Phase 3: Data Export Enhancement + AI Transparency

### 3.1 Enhanced Data Export

- Add **CSV export** option alongside existing JSON and PDF
- Add a **re-authentication step** before export: user must re-enter password
- Show a brief "Your export is being prepared..." state

### 3.2 AI Transparency Section

Add to Settings (under Legal & Privacy):
- "How We Use AI" expandable section
- Simple explanation: what data AI sees, what it does, what it doesn't do
- No hidden processing disclosure

### 3.3 Data Breach Preparation

Create an internal-facing document/component (not user-visible) that documents:
- Detection workflow
- Logging incident procedure  
- User notification template

This will be a markdown file in the repo for now — no UI needed.

---

## Phase 4: Stripe Payments (Separate Phase)

Stripe integration is a significant standalone feature. I recommend implementing the compliance/legal layer first, then tackling Stripe separately. When ready:
- Enable Stripe via the Lovable Stripe tool
- Create subscription plans
- Add subscription management UI in Settings
- Handle webhooks for status sync

---

## Technical Details

### New Files to Create
```text
src/pages/Privacy.tsx
src/pages/Terms.tsx  
src/pages/RefundPolicy.tsx
src/pages/Disclaimer.tsx
src/components/layout/LegalFooter.tsx
src/components/compliance/CookieConsent.tsx
supabase/functions/delete-account/index.ts
```

### Files to Modify
```text
src/App.tsx                    — Add new routes
src/pages/Auth.tsx             — Age gate checkbox + legal links
src/pages/Settings.tsx         — New Legal & Privacy section, enhanced delete flow
src/components/layout/AppLayout.tsx — Add LegalFooter
```

### Database Migration
```sql
-- consent_logs table
CREATE TABLE public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_type text NOT NULL,
  granted boolean NOT NULL,
  ip_country text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert consent logs"
  ON public.consent_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for cookie consent before login
CREATE POLICY "Anon can insert consent logs"
  ON public.consent_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
```

### UX Approach
- All legal pages use the same minimal layout: centered content, max-w-2xl, serif headings, light body text
- Cookie banner is a non-intrusive bottom bar, not a modal
- Settings sections use existing `SettingsSection` / `SettingsRow` pattern
- No aggressive popups anywhere
- Footer is a single-line, ultra-minimal design

---

## Recommended Implementation Order

1. **Legal pages** (Privacy, Terms, Refund, Disclaimer) + routes
2. **Footer component** + integration into AppLayout
3. **Auth page** age gate + legal links
4. **Settings** Legal & Privacy section
5. **Delete account** edge function + enhanced UI
6. **Cookie consent** banner + consent logging table
7. **AI transparency** section in Settings
8. **Data export** CSV + re-auth step
9. **Stripe** (separate phase)

Shall I proceed with implementation?

