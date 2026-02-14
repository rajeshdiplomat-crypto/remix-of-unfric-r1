

## Move Time Period Selector to Vertical Left Position

Currently the Today/Tomorrow/Week pills sit horizontally at the top of the insights area. The change moves them to a vertical strip on the left edge of the insights content.

### Changes

**`src/components/tasks/InsightsPanel.tsx`**

1. **Restructure the insights content area** (lines 338-368): Wrap the entire insights body in a horizontal `flex` container. The left side becomes a narrow vertical column with the three period buttons stacked vertically, and the right side contains the KPIs + charts.

2. **Convert the period selector** (lines 343-358): Change from a horizontal `flex gap-1` row to a vertical `flex flex-col` stack. Each button gets slightly adjusted padding for vertical readability. The container gets a left-aligned vertical pill style.

3. **Move the "Hide Insights" toggle**: Keep it in the top-right corner of the charts area, or inline with the first chart row header.

4. **Remove the top `mb-2` header row**: Since the period selector moves to the left, the horizontal header bar is no longer needed as a separate row.

### Layout Change

```text
Before:
[Today] [Tomorrow] [Week]        [Hide Insights]
[KPIs] [Chart 1] [Chart 2] [Pie]

After:
[Today  ]  [KPIs] [Chart 1] [Chart 2] [Pie]  [Hide]
[Tomorrow]
[Week   ]
```

### Technical Detail

- Lines 340-368: Replace the horizontal header + body structure with a single `flex` row
- The period selector becomes a `flex flex-col gap-1` column with `w-[72px] shrink-0` and vertical centering
- The existing KPIs + charts `flex gap-3 h-[180px]` block moves into the right side of this new flex container
- The "Hide Insights" button stays top-right via absolute positioning or flex justify-between in the charts header

