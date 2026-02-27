

## Fix Tablet Vertical Background Gap

**Problem:** On tablet, the viewport is tall relative to the image width, so the image doesn't fill the container height — leaving gray gaps top/bottom.

**Solution:** Instead of forcing the image container to full viewport height, let the image panel scroll-independently with `overflow-hidden` and use `object-cover` but with a `min-height` and `max-height` approach that prioritizes showing the full image.

**Best approach (same as current flexible width, but fix the height gap):**

Change the image container to use `overflow-hidden` and switch to `object-cover` — but cap the container width so it doesn't take too much space. The image will fill the container completely (no gaps), with minimal cropping that scales gracefully:

**`src/pages/Auth.tsx` line 88-93:**

```tsx
// Before
<div className="hidden md:flex md:max-w-[55%] relative flex-shrink-0 items-center">
  <img src={authImage} alt="" className="h-full w-auto max-w-full object-contain" />

// After  
<div className="hidden md:block md:w-[45%] lg:w-[50%] relative flex-shrink-0 overflow-hidden">
  <img src={authImage} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
```

- **`object-cover`** fills container fully — no gaps, no background color needed
- **`object-center`** keeps focal point centered
- **`md:w-[45%]` / `lg:w-[50%]`** — narrower on tablet (less crop), wider on desktop
- On tablet: container is narrower so the tall portrait image fits with minimal side crop
- On desktop: container is wider, image shows more width naturally
- This matches BotPenguin's approach — image fills its panel completely at all sizes

