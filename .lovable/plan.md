

## Fix: Loading Screen Scrolls With Page Content

### Root Cause

The `PageLoadingScreen` uses `position: fixed` to stay pinned to the viewport. However, it is rendered **inside** the `PageTransition` wrapper, which applies `animate-page-enter` -- a CSS animation using `transform: translateY()`.

Per the CSS spec, when an ancestor element has a `transform` property, `position: fixed` no longer positions relative to the viewport. Instead, it positions relative to that transformed ancestor. Since the page content scrolls independently (per the app's scrolling architecture), the "fixed" loading screen scrolls along with it.

### Solution

Move the `PageLoadingScreen` rendering **outside** the scrollable content container in each page component, or better yet, render it via a **portal** to `document.body` so it is completely outside the transformed ancestor tree.

### Changes

#### 1. `src/components/common/PageLoadingScreen.tsx`
- Wrap the overlay `div` in a **React portal** (`ReactDOM.createPortal`) targeting `document.body`
- This guarantees it renders outside `PageTransition`'s transform context, making `position: fixed` work correctly regardless of ancestor transforms

```text
Before:
  PageTransition (has transform)
    └── Manifest page
         └── PageLoadingScreen (position: fixed -- BROKEN)

After:
  PageTransition (has transform)
    └── Manifest page (PageLoadingScreen renders here in JSX but...)
  document.body
    └── PageLoadingScreen (portaled -- position: fixed works correctly)
```

#### 2. Also fix the `onFinished` race condition (from previous diagnosis)
- Store `onFinished` in a `useRef` so parent re-renders don't reset the exit timer
- This prevents the loading screen from occasionally getting stuck

Both fixes are in the same file (`PageLoadingScreen.tsx`). No other files need changes.

### Technical Details

In `PageLoadingScreen.tsx`:
- Import `createPortal` from `react-dom`
- Wrap the returned JSX (the `style` tag + overlay div) in `createPortal(..., document.body)`
- Add `const onFinishedRef = useRef(onFinished)` and keep it synced, then use it in the exit `useEffect` instead of `onFinished` directly, removing `onFinished` from the dependency array

