
# Insights Page Layout Redesign

## Goal
Restructure the Insights page to use a two-column layout matching the other pages - dashboard content on the left, descriptive text on the right, with better vertical space usage.

---

## New Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│   Left (Dashboard)             │   Right (Descriptive Text)        │
│                                │                                   │
│   [PatternsDashboardEnhanced]  │   Badge: "Your Patterns"          │
│                                │   Title: "Insights & Analytics"   │
│   (Full patterns dashboard     │   Description text                │
│    with tabs: Overview,        │   • AI-powered pattern detection  │
│    Moods, Context)             │   • Mood distribution analysis    │
│                                │   • Context-based insights        │
│                                │                                   │
│                                │   [This Week: X] [This Month: Y]  │
│                                │                                   │
│                                │   [← Back to Check-in]            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Changes to EmotionsPageInsights.tsx

### 1. Two-Column Grid Layout
- **Left column (order-1)**: PatternsDashboardEnhanced
- **Right column (order-2)**: Descriptive text, stats, navigation

### 2. Remove Centered Title Section
- Move the title content into the right descriptive column
- Match the format used in Feel/Regulate pages (badge, title, description, features list)

### 3. Move Stats to Right Column
- Move StatBadge components into the descriptive section
- Position below the features list

### 4. Add Back Button to Right Column
- Move navigation button to bottom of right column

---

## Code Structure

```tsx
<div className="flex flex-col animate-in fade-in duration-500">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
    
    {/* Left: Dashboard */}
    <div className="flex flex-col order-2 lg:order-1">
      <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
    </div>
    
    {/* Right: Descriptive Text */}
    <div className="flex flex-col justify-center order-1 lg:order-2">
      <div className="space-y-4 max-w-md">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit bg-primary/10 text-primary">
          <BarChart3 className="h-3 w-3" />
          Your Patterns
        </div>
        
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-light leading-tight">
          Insights &{" "}
          <span className="font-semibold text-primary">Analytics</span>
        </h2>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          Discover patterns in your emotional journey based on {entries.length} check-ins.
        </p>
        
        {/* Features */}
        <ul className="space-y-2">
          <li>• AI-powered pattern detection</li>
          <li>• Mood distribution analysis</li>
          <li>• Context-based insights</li>
        </ul>
        
        {/* Stats */}
        <div className="flex gap-3 pt-2">
          <StatBadge label="This Week" value={weekEntries} />
          <StatBadge label="This Month" value={monthEntries} />
        </div>
        
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back to Check-in
        </Button>
      </div>
    </div>
  </div>
</div>
```

---

## Summary

| Element | Before | After |
|---------|--------|-------|
| Layout | Centered, single column | Two-column grid |
| Dashboard | Below title | Left column |
| Title/Description | Centered at top | Right column |
| Stats badges | Top-right header | Right column, below features |
| Back button | Top-left header | Right column, bottom |

---

## File to Modify
`src/components/emotions/EmotionsPageInsights.tsx`
