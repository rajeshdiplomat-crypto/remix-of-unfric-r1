

# Simplified Journal Settings

## Overview

Simplify journal settings into two clear concepts:
1. **Per-day settings** -- accessible from the editor itself (skin, lines, background) for the current entry only
2. **Global defaults** -- on the Settings page, clearly grouped and labeled as applying to **new entries going forward**

Remove the "Effective From/To" date range concept entirely. Instead, when a global setting is changed, it simply applies to all new entries created after that point. Existing entries keep whatever visuals they were saved with.

## How It Works

- **New entry created**: Uses the current global defaults (skin, line style, structured/unstructured mode) to initialize the entry. The chosen skin and line style are saved into the entry's `page_settings` JSONB column at creation time.
- **Existing entry opened**: Reads skin and line style from the entry's own `page_settings`. If none exist (old entries), falls back to system defaults (Minimal Light, no lines).
- **Per-day override**: A settings icon in the editor header opens a compact modal to change skin and line style for just that entry. Changes are saved to the entry's `page_settings` column.

## Changes

### 1. Settings Page (`src/pages/Settings.tsx`)

**Remove:**
- "Settings Effective From" date input
- "Settings Effective To" date input

**Regroup into two clear sections:**

**"New Entry Defaults"** (sub-section under Journal Preferences):
- Journal Mode (Structured / Unstructured)
- Auto-apply prompts on new entries (toggle)
- Default Journal Skin (dropdown)
- Default Editor Lines (dropdown)
- Template Questions (drag-and-drop editor)

Add a helper note: *"These settings apply to new journal entries going forward. Existing entries keep their original look."*

### 2. Journal Page (`src/pages/Journal.tsx`)

**Remove:**
- The `isTemplateEffective` logic and all references to `effectiveFrom` / `effectiveTo`
- The date-range-based skin/line fallback logic

**Add:**
- On **new entry creation**: Save the current global skin and line style into the entry's `page_settings` column (e.g., `{ skinId: "warm-paper", lineStyle: "ruled" }`)
- On **entry load**: Read `page_settings` from the fetched DB row and use its `skinId` and `lineStyle`. Fall back to system defaults if absent.
- A settings icon button in the `journalHeader` bar (next to Save/Fullscreen) that opens `JournalSettingsModal` in "entry" mode

**Skin resolution (simplified):**
```text
Dark mode active?  -->  Always use "midnight-dark"
Entry has page_settings.skinId?  -->  Use that
Otherwise  -->  Use "minimal-light"
```

### 3. JournalSettingsModal (`src/components/journal/JournalSettingsModal.tsx`)

**Add a `mode` prop:**
- `mode="global"` (used by Settings page) -- Shows all sections: skin, lines, questions, auto-apply toggle
- `mode="entry"` (used by editor toolbar) -- Shows only skin and line style pickers, plus a "Reset to Default" button that clears the per-entry overrides

**Add callbacks:**
- `onEntryOverrideSave?: (skinId: string, lineStyle: string) => void` -- for entry mode
- `onEntryOverrideReset?: () => void` -- clears overrides back to defaults

### 4. Entry Save Logic (`src/pages/Journal.tsx`)

When saving (both insert and update), include the current skin and line style in `page_settings`:

```text
page_settings: { skinId: currentSkinId, lineStyle: currentLineStyle }
```

This ensures each entry preserves its visual settings permanently.

### 5. Types Cleanup (`src/components/journal/types.ts`)

- Remove `effectiveFrom` and `effectiveTo` from `JournalTemplate` interface (they become unused)

### 6. Editor Component (`src/components/journal/JournalTiptapEditor.tsx`)

- The `defaultLineStyle` prop continues to work as-is -- Journal.tsx will pass the resolved line style (from entry's `page_settings` or global default)

## Files to Change

| File | What Changes |
|---|---|
| `src/pages/Settings.tsx` | Remove date range inputs, add helper text clarifying "new entries only" |
| `src/pages/Journal.tsx` | Remove date range logic, add per-entry settings button, save/load `page_settings`, resolve skin from entry data |
| `src/components/journal/JournalSettingsModal.tsx` | Add `mode` prop for global vs entry modes, add entry override callbacks |
| `src/components/journal/types.ts` | Remove `effectiveFrom` and `effectiveTo` from `JournalTemplate` |

No database migration needed -- `page_settings` JSONB column already exists on `journal_entries`.

