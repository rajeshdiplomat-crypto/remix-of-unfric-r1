

## Fix: Show Full Image on Desktop (No Cropping)

**Problem:** The image uses `object-cover` which crops it to fill the container. User wants the entire image visible (like tablet view) without any part being hidden.

**Change — `src/pages/Auth.tsx` (line 88-93):**

Replace the image container approach:
- Change image from `object-cover` to `object-contain` so the full image is always visible
- Add a matching background color behind the image so the letterbox areas blend seamlessly (using a warm tone sampled from the editorial image edges)
- Keep the container at `md:w-[55%]` with full height
- Result: entire image visible at all screen widths, no cropping, background fills any empty space

```
<!-- Before -->
<div className="hidden md:block md:w-[55%] relative flex-shrink-0">
  <img ... className="absolute inset-0 w-full h-full object-cover object-[70%_center]" />

<!-- After -->
<div className="hidden md:block md:w-[55%] relative flex-shrink-0 bg-[#8B7355]">
  <img ... className="absolute inset-0 w-full h-full object-contain" />
```

The warm brown background (`#8B7355`, sampled from the image palette) fills any letterbox gaps so it looks intentional and seamless at any aspect ratio.

