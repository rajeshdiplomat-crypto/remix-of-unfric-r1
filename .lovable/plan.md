

# Logo Integration Plan

## Overview
Replace the current text-only logo with your uploaded brand logo (brain illustration with "unfric" wordmark and "Life unfrictioned" tagline) throughout the application.

---

## Logo Placement Analysis

Your logo will be used in these locations:

| Location | Current State | New Logo Usage |
|----------|--------------|----------------|
| **Header (ZaraHeader)** | Text "unfric" | Brain icon + wordmark (compact) |
| **Side Drawer (ZaraDrawer)** | Text "unfric" | Full logo with tagline |
| **Auth Page Header** | Text "unfric" | Full logo with tagline |
| **Auth Page Footer** | Text "unfric" | Full logo |
| **Mobile Navigation** | Text "unfric" | Compact brain + wordmark |
| **App Sidebar (collapsed)** | Letter "u" | Brain icon only |
| **App Sidebar (expanded)** | Text "unfric" | Brain icon + wordmark |
| **Loading Screen** | Animated text | Full logo with animation |
| **Favicon** | Current png | Brain icon (cropped) |

---

## Implementation Steps

### Step 1: Copy Logo Asset to Project
Copy the uploaded image to the `src/assets` folder for proper bundling:
```
user-uploads://WhatsApp_Image_2026-02-02_at_17.26.11_1.jpeg → src/assets/unfric-logo.png
```

### Step 2: Create Enhanced UnfricLogo Component

Update `src/components/common/UnfricLogo.tsx` to support multiple variants:

**New Props:**
- `variant`: `'full'` (brain + text + tagline) | `'compact'` (brain + text) | `'icon'` (brain only) | `'text'` (current behavior)
- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `showTagline`: boolean (for full variant)

**Size Mappings:**
```
icon-only:  sm=24px, md=32px, lg=40px, xl=56px
compact:    sm=h-6, md=h-8, lg=h-10, xl=h-14
full:       sm=h-8, md=h-10, lg=h-14, xl=h-20
```

### Step 3: Update All Logo Usages

**Files to modify:**

1. **`src/components/layout/ZaraHeader.tsx`**
   - Use `variant="compact"` with brain + wordmark
   - Adjust sizing for header context

2. **`src/components/layout/ZaraDrawer.tsx`**
   - Use `variant="full"` with tagline for drawer top
   - More prominent display since there's space

3. **`src/components/layout/AppSidebar.tsx`**
   - Collapsed: `variant="icon"` (brain only)
   - Expanded: `variant="compact"` (brain + wordmark)

4. **`src/components/layout/MobileNav.tsx`**
   - Use `variant="compact"` for mobile header

5. **`src/pages/Auth.tsx`**
   - Header: `variant="compact"` (brain + wordmark)
   - Footer: `variant="full"` with tagline

6. **`src/components/common/PageLoadingScreen.tsx`**
   - Replace animated text with animated logo reveal
   - Fade-in brain, then wordmark, then tagline

### Step 4: Update Favicon
Copy a cropped version of the brain icon to `public/favicon.png` for browser tab display.

---

## Technical Details

### New UnfricLogo Component Structure

```typescript
interface UnfricLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'icon' | 'text';
  showTagline?: boolean;
}

// Renders:
// - variant="icon": Just the brain illustration
// - variant="compact": Brain + "unfric" wordmark
// - variant="full": Brain + "unfric" + "Life unfrictioned"
// - variant="text": Current text-only (backward compatible)
```

### Image Import Pattern

```typescript
import unfricLogo from "@/assets/unfric-logo.png";

// Usage in component
<img src={unfricLogo} alt="unfric" className="h-10" />
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/assets/unfric-logo.png` | Create (copy from upload) |
| `src/components/common/UnfricLogo.tsx` | Major update - add image variants |
| `src/components/layout/ZaraHeader.tsx` | Update logo props |
| `src/components/layout/ZaraDrawer.tsx` | Update logo props |
| `src/components/layout/AppSidebar.tsx` | Update logo variants |
| `src/components/layout/MobileNav.tsx` | Update logo props |
| `src/pages/Auth.tsx` | Update logo in header and footer |
| `src/components/common/PageLoadingScreen.tsx` | Update to use image logo |
| `public/favicon.png` | Update with brain icon |

---

## Expected Outcome

After implementation:
- Brand logo (brain illustration) visible in header, drawer, sidebar, and auth pages
- Compact version for space-constrained areas (header, mobile)
- Full version with tagline for prominent areas (drawer, auth page)
- Icon-only for collapsed sidebar
- Updated favicon showing the brain icon
- Smooth fade-in animation on loading screen
- Consistent branding across the entire application

