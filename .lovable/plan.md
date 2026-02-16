

# Remove Redundant "Auto-apply Prompts" Toggle

## Why

With the simplified "new entries forward" model, the toggle is redundant:
- Structured mode already means "add prompts to new entries"
- Unstructured mode already means "start blank"
- There is no date-range gating anymore, so there is no scenario where you would want Structured mode but NOT auto-apply prompts

## Changes

### Settings Page (`src/pages/Settings.tsx`)

- Remove the "Auto-apply on new entries" Switch from the Journal Preferences section
- The Structured / Unstructured mode toggle alone controls whether new entries get prompts

### Types (`src/components/journal/types.ts`)

- Remove `applyOnNewEntry` from `JournalTemplate` interface
- Update `DEFAULT_TEMPLATE` to remove the field

### Journal Page (`src/pages/Journal.tsx`)

- Remove any references to `template.applyOnNewEntry` in the entry initialization logic
- Use `journalMode === "structured"` as the sole check for whether to insert template questions into a new entry

### JournalSettingsModal (`src/components/journal/JournalSettingsModal.tsx`)

- Remove the "Auto-apply on new entries" Switch and its local state (`applyOnNewEntry`)
- Remove the field from the save handler

## Result

The Journal Preferences section becomes cleaner:
1. Journal Mode (Structured / Unstructured)
2. Default Journal Skin
3. Default Editor Lines
4. Template Questions (visible only in Structured mode)

One toggle, one behavior -- no confusion.
