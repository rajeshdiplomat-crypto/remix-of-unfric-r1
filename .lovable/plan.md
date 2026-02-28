

# Auth Page Premium Elevation Plan

## Overview
Refactor `src/pages/Auth.tsx` and add supporting CSS to create a luxury editorial authentication experience with depth, motion, and refined typography.

---

## Changes

### 1. Add Playfair Display font and Auth-specific CSS (`src/index.css`)
- Import `Playfair Display` (weight 300, 400; italic) from Google Fonts
- Add Ken Burns keyframe animation (`@keyframes ken-burns`) — slow infinite 20s zoom from scale(1) to scale(1.08)
- Add film grain SVG overlay utility (`.film-grain::after` with 3% opacity noise)
- Add whisper loading bar keyframe (`@keyframes whisper-load`) — thin 1px line animating left-to-right at top of form

### 2. Refactor `src/pages/Auth.tsx`

**Layout — Asymmetric 38/62 Split:**
- Change image column from `md:w-[55%] lg:w-[40%]` to `md:w-[38%]`
- Form column becomes the remaining 62%

**Living Image (Desktop):**
- Apply Ken Burns animation class to the `<img>` tag
- Add a film-grain overlay `<div>` inside the image container (fixed SVG noise at 3% opacity)

**Mobile — Full-bleed Background:**
- Remove `hidden md:block` from the image container
- On mobile (`md:hidden`), render the auth image as a fixed full-screen background behind the form
- Apply `backdrop-blur-3xl` and `bg-black/40` overlay on the form wrapper for readability
- Show logo over the blurred background on mobile

**Floating Glass Form Card (Desktop):**
- Wrap the form `<div>` in a glass card with `backdrop-blur-xl border border-white/10 shadow-2xl rounded-sm`
- Offset it slightly left with negative margin (`-ml-12 lg:-ml-20`) so it overlaps the editorial image side

**Editorial Typography:**
- Title `h1`: use `font-['Playfair_Display'] text-4xl font-light italic` for the main word
- Keep subtitle in Inter, `text-sm font-light text-muted-foreground`

**Architectural Radius:**
- Replace all `rounded-lg` on inputs and buttons with `rounded-sm` (6px, already defined)

**Accessibility — Label Sizes:**
- Change `text-[9px]` and `text-[10px]` labels to `text-[11px]` with `tracking-[0.3em] opacity-50`
- This maintains the "tiny label" aesthetic without sacrificing readability

**Whisper Loading:**
- Replace the inline `<Loader2>` spinner on the submit button with a thin 1px progress bar at the top of the form card
- Button text changes to the loading label but no spinner icon

**Motion — Mode Transitions:**
- Since framer-motion is not installed and adding it just for auth is heavy, implement CSS-based transitions using `@starting-style` or a simple opacity/transform transition on mode change via a `key={mode}` trick with CSS `animate-fade-in` (slide up + fade, 400ms ease-out)

### 3. Keyframes and utilities to add in `src/index.css`

```css
/* Ken Burns */
@keyframes ken-burns {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}
.animate-ken-burns {
  animation: ken-burns 20s ease-in-out infinite alternate;
}

/* Film grain overlay */
.film-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* inline noise SVG */
  pointer-events: none;
}

/* Whisper loading bar */
@keyframes whisper-load {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Auth form fade-in */
@keyframes auth-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-auth-fade-in {
  animation: auth-fade-in 400ms ease-out;
}
```

---

## Technical Notes

- **No new dependencies.** Playfair Display is loaded via Google Fonts CSS import. No framer-motion needed — using CSS animations with React `key` prop to trigger re-mount on mode change.
- **Mobile image strategy:** The image renders twice in the DOM (once as background for mobile, once as the left column for desktop) using responsive visibility classes. This avoids layout complexity.
- **Dark mode compatibility:** The glass card uses `border-white/10` which works in both themes. The mobile overlay uses `bg-black/40` which is theme-independent.
- **Radius change:** `rounded-sm` is already defined as `0.375rem` (6px) in `tailwind.config.ts`.

