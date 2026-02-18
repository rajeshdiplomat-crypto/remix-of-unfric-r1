

# Fix Glassmorphic Loading Screen Across All Modules

## Current Problem

The glassmorphic loading screen works correctly on the **Diary** page but has two issues on all other modules (Tasks, Emotions, Habits, Manifest, ManifestPractice, Journal):

1. **Abrupt disappearance**: These pages use `showLoading && <PageLoadingScreen />`, which instantly removes the component when data finishes loading -- no fade-out animation.
2. **Solid-looking glass on Tasks**: The Tasks page hides its content with `opacity-0` until loading completes, so there is nothing behind the glass to blur, making it appear solid.

## Solution

Apply the same proven pattern from the Diary page to all modules:

- Replace the simple `showLoading` conditional with a `loadingFinished` state
- Use `PageLoadingScreen`'s `isDataReady` and `onFinished` props to trigger a controlled fade-out
- Remove any `opacity-0` hiding of content so the module UI renders visibly behind the glass overlay

## Changes Per File

### 1. `src/pages/Tasks.tsx`
- Add `loadingFinished` state
- Compute `isDataReady` from the loading/data state
- Remove the `contentReady` / `opacity-0` pattern that hides content behind the glass
- Render `PageLoadingScreen` with `isDataReady` and `onFinished` props

### 2. `src/pages/Emotions.tsx`
- Add `loadingFinished` state
- Use `isDataReady` + `onFinished` pattern
- Content already renders behind the overlay, so no opacity fix needed

### 3. `src/pages/Habits.tsx`
- Same `loadingFinished` + `isDataReady` + `onFinished` upgrade

### 4. `src/pages/Manifest.tsx`
- Same upgrade pattern

### 5. `src/pages/ManifestPractice.tsx`
- Same upgrade pattern

### 6. `src/pages/Journal.tsx`
- Same upgrade pattern

## Pattern Applied (same as Diary)

```tsx
const [loadingFinished, setLoadingFinished] = useState(false);
const isDataReady = !loading;

return (
  <>
    {!loadingFinished && (
      <PageLoadingScreen
        module="tasks"
        isDataReady={isDataReady}
        onFinished={() => setLoadingFinished(true)}
      />
    )}
    <div className="module-content">
      {/* Content visible behind glass */}
    </div>
  </>
);
```

This ensures every module gets the smooth fade-out animation and shows its content beautifully diffused behind the frosted glass during loading.
