

# Glassmorphic Loading Screen - Show Module Content Behind

## Problem
The loading screen overlay currently uses `background-color` at 60% opacity combined with a heavy 24px blur, which makes it appear nearly solid. The user wants the current module/page content to be visible underneath, creating an authentic frosted-glass look.

## Solution
Reduce the background opacity from 0.6 to a much lower value (around 0.15-0.2) so the underlying module page content "bleeds" through the blur. This keeps the glass effect while revealing the page structure underneath.

## Technical Details

### File: `src/components/common/PageLoadingScreen.tsx`

Changes to the overlay `div` inline styles:

1. **Reduce background opacity**: Change `hsl(var(--background) / 0.6)` to `hsl(var(--background) / 0.15)` -- this lets the module's colors and layout show through
2. **Keep the blur**: Retain `backdrop-blur-2xl` (24px) so content is beautifully diffused but still recognizable
3. **Keep the border and shadow**: The 0.5px border and inset glow remain for the "lensed" glass edge
4. **Slightly soften the exit animation**: No changes needed, existing fade-out works well with the transparent look

This single change ensures the Emotions page (or any module) is visible as a soft, colorful backdrop behind the loading text and logo, matching the Liquid Glass design language used throughout the app.

