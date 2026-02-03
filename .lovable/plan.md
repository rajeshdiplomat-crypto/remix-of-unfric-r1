

# Complete Diary Page Redesign - Facebook-Style Feed Layout

## Overview

Based on the Facebook screenshot provided, we'll completely redesign the Diary page to follow a true **3-column Facebook layout** with:
- **Left Sidebar**: Fixed navigation/shortcuts (currently missing in the app)
- **Center Feed**: Scrollable feed with post cards
- **Right Sidebar**: Performance snapshot, quick actions, filters

The current design has a hero + 2-column layout. We need to remove the hero and implement a proper Facebook-style structure.

---

## Key Design Elements from Facebook Reference

| Element | Facebook | New Diary Design |
|---------|----------|------------------|
| **Layout** | 3-column (nav / feed / widgets) | 3-column (shortcuts / feed / insights) |
| **Left Sidebar** | Profile, shortcuts, menu items | Quick links to modules, saved items |
| **Center Feed** | Scrollable post cards | Feed cards (journal, tasks, emotions, etc.) |
| **Right Sidebar** | Sponsored, friend requests, contacts | Performance snapshot, quick actions, filters |
| **Hero** | None | **Remove completely** |
| **Post Cards** | Avatar, name, time, content, reactions | Same pattern with module-specific styling |

---

## Implementation Plan

### 1. Remove DiaryHero Component

**File: `src/pages/Diary.tsx`**
- Remove the `<DiaryHero />` component entirely
- Remove the import statement

### 2. Create New Left Sidebar Component

**New File: `src/components/diary/DiaryLeftSidebar.tsx`**

Content:
- User profile card (avatar, name)
- Module shortcuts (Tasks, Journal, Notes, Trackers, Manifest, Emotions)
- "Saved" quick link
- Optional: Recent activity summary

```tsx
// Structure
<div className="flex flex-col h-full">
  {/* Profile */}
  <div className="p-4 flex items-center gap-3">
    <Avatar />
    <span>User Name</span>
  </div>
  
  {/* Navigation Links */}
  <nav className="flex flex-col gap-1 p-2">
    <NavItem icon={CheckSquare} label="Tasks" onClick={() => navigate('/tasks')} />
    <NavItem icon={PenLine} label="Journal" onClick={() => navigate('/journal')} />
    <NavItem icon={FileText} label="Notes" onClick={() => navigate('/notes')} />
    <NavItem icon={BarChart3} label="Trackers" onClick={() => navigate('/trackers')} />
    <NavItem icon={Sparkles} label="Manifest" onClick={() => navigate('/manifest')} />
    <NavItem icon={Heart} label="Emotions" onClick={() => navigate('/emotions')} />
    <Separator />
    <NavItem icon={Bookmark} label="Saved" onClick={() => setFilter('saved')} />
  </nav>
</div>
```

### 3. Restructure Main Page Layout

**File: `src/pages/Diary.tsx`**

Change from:
```
┌─────────────────────────────────────────────────────┐
│                    DiaryHero                         │
├────────────────────────────────┬────────────────────┤
│   Feed (scrollable)            │   Sidebar (scroll) │
└────────────────────────────────┴────────────────────┘
```

To Facebook-style:
```
┌────────────┬───────────────────────────┬─────────────┐
│  Left Nav  │      Center Feed          │  Right      │
│  (fixed)   │    (scrollable)           │  Sidebar    │
│            │                           │  (fixed)    │
│  Profile   │  ┌─────────────────────┐  │  Insights   │
│  ─────     │  │ Create Post Box     │  │  ─────      │
│  Tasks     │  └─────────────────────┘  │  Stats      │
│  Journal   │  ┌─────────────────────┐  │  Quick Act  │
│  Notes     │  │ Feed Card 1         │  │  Filters    │
│  Trackers  │  │ (journal entry)     │  │             │
│  Manifest  │  └─────────────────────┘  │             │
│  Emotions  │  ┌─────────────────────┐  │             │
│  ─────     │  │ Feed Card 2         │  │             │
│  Saved     │  │ (task completed)    │  │             │
│            │  └─────────────────────┘  │             │
│            │           ↕               │             │
└────────────┴───────────────────────────┴─────────────┘
```

### 4. Add "Create Post" Box (Facebook's Post Composer)

**New File: `src/components/diary/DiaryCreatePost.tsx`**

A quick-action composer bar at the top of the feed:
```tsx
<Card className="mb-4">
  <div className="p-4 flex items-center gap-3">
    <Avatar />
    <div 
      className="flex-1 bg-muted rounded-full px-4 py-2 cursor-pointer"
      onClick={() => setIsJournalModalOpen(true)}
    >
      What's on your mind?
    </div>
  </div>
  <Separator />
  <div className="flex items-center justify-around p-2">
    <Button variant="ghost" onClick={() => navigate('/journal')}>
      <PenLine /> Journal
    </Button>
    <Button variant="ghost" onClick={() => navigate('/tasks')}>
      <CheckSquare /> Task
    </Button>
    <Button variant="ghost" onClick={() => navigate('/emotions')}>
      <Heart /> Check-in
    </Button>
  </div>
</Card>
```

### 5. Update Feed Card Styling

**File: `src/components/diary/DiaryFeedCard.tsx`**

Enhance to match Facebook's post card design:
- Larger avatar (40px instead of 32px)
- Module name as "author" with timestamp below
- Cleaner action bar (React, Comment, Share)
- Remove some visual clutter

### 6. Simplify Right Sidebar

**File: `src/components/diary/DiarySidebar.tsx`**

Keep existing content but:
- Make it sticky/fixed
- Add subtle background distinction
- Keep Performance Snapshot, Quick Actions, Filters

### 7. Page Grid Structure

**File: `src/pages/Diary.tsx`**

New structure:
```tsx
<div className="flex w-full h-full overflow-hidden">
  {/* Left Sidebar - Hidden on mobile, fixed on desktop */}
  <aside className="hidden lg:flex flex-col w-[280px] shrink-0 h-full overflow-y-auto border-r border-border/20 bg-background">
    <DiaryLeftSidebar 
      user={user}
      filter={filter}
      onFilterChange={setFilter}
      onQuickAction={handleQuickAction}
    />
  </aside>

  {/* Center Feed - Scrollable */}
  <main className="flex-1 min-w-0 h-full overflow-y-auto px-4 lg:px-8 py-4">
    <div className="max-w-[680px] mx-auto">
      {/* Create Post Box */}
      <DiaryCreatePost 
        user={user}
        onOpenJournal={() => setIsJournalModalOpen(true)}
        onQuickAction={handleQuickAction}
      />
      
      {/* Feed Cards */}
      <div className="space-y-4">
        {sortedEvents.map(event => (
          <DiaryFeedCard ... />
        ))}
      </div>
    </div>
  </main>

  {/* Right Sidebar - Hidden on mobile/tablet, fixed on desktop */}
  <aside className="hidden xl:flex flex-col w-[340px] shrink-0 h-full overflow-y-auto border-l border-border/20 bg-background/50">
    <DiarySidebar ... />
  </aside>
</div>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/diary/DiaryLeftSidebar.tsx` | Left navigation sidebar with module shortcuts |
| `src/components/diary/DiaryCreatePost.tsx` | Facebook-style "What's on your mind?" composer |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Diary.tsx` | Complete layout restructure, remove hero, add 3-column grid |
| `src/components/diary/DiaryFeedCard.tsx` | Enhance card styling to match Facebook posts |
| `src/components/diary/DiarySidebar.tsx` | Minor adjustments for new layout context |
| `src/components/diary/DiaryHero.tsx` | Can be deleted (no longer used) |

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (`< lg`) | Single column feed only, bottom nav for quick actions |
| Tablet (`lg`) | 2-column: Feed + Right sidebar |
| Desktop (`xl`) | 3-column: Left nav + Feed + Right sidebar |

---

## Technical Details

### CSS Grid/Flex Structure
```css
/* Main container */
.diary-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Left sidebar */
.left-sidebar {
  width: 280px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  position: sticky;
  top: 0;
}

/* Center feed */
.center-feed {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  max-width: 680px; /* Facebook's max width for posts */
  margin: 0 auto;
}

/* Right sidebar */
.right-sidebar {
  width: 340px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  position: sticky;
  top: 0;
}
```

### Key Differences from Current Design
1. **No Hero** - Removed completely for Facebook-style layout
2. **Left Navigation** - New sidebar with module shortcuts
3. **Create Post Box** - Quick action composer at top of feed
4. **Centered Feed** - Max-width constrained, centered in available space
5. **Independent Scrolling** - Each column scrolls independently (Facebook-style already implemented)

