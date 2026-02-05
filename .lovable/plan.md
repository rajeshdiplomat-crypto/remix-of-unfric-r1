
# Restore Context Step in Flow (Not in Navigation)

## Clarification
You want:
1. ✅ **Remove "Context" from navigation bar** - Already done
2. ❌ **Keep Context step in the flow** - This was accidentally removed

The Context page should appear **after clicking Continue on the Feel page**, before moving to Regulate.

---

## Current Flow (Broken)
```text
Feel → [Continue] → Save → Regulate
```

## Correct Flow (To Restore)
```text
Feel → [Continue] → Context → [Save] → Regulate
```

---

## Changes Required

### File: `src/pages/Emotions.tsx`

**1. Add internal "context" view state** (not exposed in navigation)

The `EmotionsView` type in navigation only has `"feel" | "regulate" | "insights"`, but we need an internal state to track when we're on the context page.

Add a separate internal state:
```typescript
// Internal flow state (includes context which is not in nav)
const [internalView, setInternalView] = useState<"feel" | "context" | "regulate" | "insights">("feel");
```

**2. Update handleContinueToSave → handleContinueToContext**

Change the function to navigate to context instead of saving directly:
```typescript
// Navigate from Feel to Context (not saving yet)
const handleContinueToContext = () => {
  if (!selectedEmotion) return;
  setSelectedQuadrant(currentQuadrant);
  setInternalView("context");
};
```

**3. Add Context page rendering**

Add the Context page between Feel and Regulate:
```tsx
{/* Context Page (between Feel and Regulate) */}
{internalView === "context" && selectedQuadrant && selectedEmotion && (
  <EmotionsPageContext
    selectedQuadrant={selectedQuadrant}
    selectedEmotion={selectedEmotion}
    note={note}
    context={context}
    sendToJournal={sendToJournal}
    saving={saving}
    onNoteChange={setNote}
    onContextChange={setContext}
    onSendToJournalChange={setSendToJournal}
    onBack={() => setInternalView("feel")}
    onSave={handleSaveCheckIn}
    onSkip={handleSkipContext}
  />
)}
```

**4. Add Skip handler**

```typescript
const handleSkipContext = async () => {
  await handleSaveCheckIn();
};
```

**5. Sync navigation with internal view**

When user clicks navigation buttons:
- "Feel" → set internalView to "feel"
- "Regulate" → set internalView to "regulate" 
- "Insights" → set internalView to "insights"

When on context page, show it (not triggered by nav).

---

## Implementation Summary

| Change | Location | Description |
|--------|----------|-------------|
| Add internalView state | Line ~45 | Track context step separately |
| Rename handleContinueToSave | Line ~169 | → handleContinueToContext, navigate to context |
| Add Context page render | After Feel | Render EmotionsPageContext when internalView === "context" |
| Update handleSaveCheckIn | Line ~176 | After save, set internalView to "regulate" |
| Sync nav with internal | handleViewChange | Map nav views to internal views |

---

## Visual Flow After Fix

```text
Navigation Bar:  [Feel] [Regulate] [Insights]
                   ↑        ↑          ↑
                   │        │          │
                   ▼        ▼          ▼
Internal View:  feel → context → regulate → insights
                         ↑
                   (not in nav,
                    shown after
                    Continue)
```

User clicks "Continue" on Feel → sees Context page → clicks "Save" → goes to Regulate.

