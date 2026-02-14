
# Settings Page: Theme Colors and Font

## What This Does

Creates a new `/settings` page where you can customize three things:
1. **Card color** -- the darker grey areas (sidebars, cards, progress panels)
2. **Background color** -- the very light grey page background behind everything
3. **Font** -- changes the font family across the entire app (no changes to bold, size, or letter case)

All changes preview instantly and persist between sessions.

---

## How It Will Look

The Settings page will follow the same Zara-inspired minimal aesthetic:
- Clean layout with clear section labels
- Color pickers for Background and Card colors with hex input
- Font selector showing 4 font pair options as clickable cards with live preview text
- A "Reset to Default" button to restore original values

---

## Technical Details

### 1. New file: `src/pages/Settings.tsx`
- Full settings page with two sections:
  - **Colors**: Two color inputs (Background + Card) with hex pickers. Uses the existing `CustomThemeContext` to apply overrides to `--background` and `--card` CSS variables only.
  - **Font**: Four selectable font pair cards (Classic Elegance, Modern Serif, Geometric, Elegant Sans). Uses the existing `FontContext`.
- Reset button clears custom colors and reverts font to default ("Elegant Sans").

### 2. Simplify `CustomThemeContext.tsx`
- Reduce `CustomColors` interface to only two fields: `background` and `card`.
- Remove the 4 unused color overrides (foreground, mutedForeground, primary, border) and all contrast-checking utilities since we are no longer exposing those.
- The `applyCustomColors` function will only set `--background` and `--card`.

### 3. Update `src/App.tsx`
- Add route: `/settings` pointing to the new `Settings` page (inside `ProtectedRoute`).
- Import the new Settings page component.

### 4. Update `ZaraDrawer.tsx`
- Replace the current inline `ThemeToggle` with a "Settings" link pointing to `/settings`.
- Remove ThemeToggle import (the light/dark toggle will move into the Settings page as an optional enhancement later, or can remain in the drawer if desired).

### 5. No changes to
- Font sizes, bold weights, uppercase/lowercase styling
- Any module-specific component code
- ThemeContext (the 6 preset themes remain untouched)
- The way fonts are loaded (Google Fonts links stay the same)
