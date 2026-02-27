

## Changes

### 1. Auth page — match app's liquid glass + glassmorphism theme

The current auth page is plain white with no ambient effects. The rest of the app uses backdrop-blur, mesh gradients, and glass cards. Updates:

**`src/pages/Auth.tsx`:**
- Add the same ambient mesh gradient overlay used in `AppLayout` behind the form side
- Apply glassmorphic card treatment to the form container (`backdrop-blur-xl`, subtle border, soft shadow)
- Add the same fixed header glass aesthetic (`bg-background/75 backdrop-blur-xl`) to the mobile top bar
- Style the submit button with rounded-md to match the app's button system
- Add `LegalFooter` at the bottom of the auth page for consistency
- Keep the editorial image panel but add a subtle gradient overlay matching the glass aesthetic

### 2. LegalFooter — reduce height to minimal single-line bar

**`src/components/layout/LegalFooter.tsx`:**
- Reduce padding from `py-4` to `py-2`
- Remove `flex-col` stacking on mobile — force single horizontal row always
- Reduce gap from `gap-2`/`gap-4` to `gap-3`
- This cuts the footer height roughly in half

### 3. CookieConsent banner — reduce vertical footprint

**`src/components/compliance/CookieConsent.tsx`:**
- Reduce inner padding from `py-4` to `py-3`
- Tighten the customize panel spacing from `space-y-4` to `space-y-3`

