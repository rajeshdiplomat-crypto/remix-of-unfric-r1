

## Adjust Image/Form Split Ratio

**Change in `src/pages/Auth.tsx`:**

1. **Image container (line ~88):** Change `md:w-[45%] lg:w-[50%]` → `md:w-[45%] lg:w-[40%]`
2. **Form container inherits remaining space via `flex-1`** — no change needed there.

Result:
- **md screens:** 45% image / 55% form (unchanged)
- **lg+ screens:** 40% image / 60% form (was 50/50)

