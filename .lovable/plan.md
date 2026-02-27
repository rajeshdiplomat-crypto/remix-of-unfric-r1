

## Show Full Image Without Background Color

**Problem:** `object-contain` leaves letterbox gaps that need a background color. User doesn't want any background color.

**Best solution:** Make the image container **width flexible** instead of fixed at 55%. Use the image as a natural-sized element that dictates its own width, so there are no gaps to fill.

**Change — `src/pages/Auth.tsx` (lines 88-93):**

Replace the fixed-width absolute-positioned image approach with a flexible layout:

```tsx
{/* Before: fixed 55% container with absolute image */}
<div className="hidden md:block md:w-[55%] relative flex-shrink-0 bg-[#8B7355]">
  <img className="absolute inset-0 w-full h-full object-contain" />

{/* After: image sizes itself naturally, no gaps, no bg color */}
<div className="hidden md:flex md:max-w-[55%] relative flex-shrink-0 items-center">
  <img className="h-full w-auto max-w-full object-contain" />
```

- Remove `bg-[#8B7355]` — no background color
- Image uses `h-full w-auto` so it fills the height and takes only the width it needs
- Container uses `max-w-[55%]` instead of `w-[55%]` so it shrinks to fit the image
- No letterbox gaps because the container matches the image width exactly
- At wide viewports the image stays tall and proportional; at narrow ones it naturally reduces
- Gradient overlay adjusted to cover only the image area

