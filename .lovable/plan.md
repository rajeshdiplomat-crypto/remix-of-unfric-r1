

# Dead Code Cleanup

## Summary
After scanning every component file against all imports in the codebase, I found **16 completely unused files** that can be safely deleted. These fall into three categories: superseded V2/Enhanced versions, abandoned features, and unused utilities.

## Files to Delete

### Emotions Module (7 files)
| File | Reason |
|---|---|
| `EmotionContextFields.tsx` | Replaced by `EmotionContextFieldsEnhanced.tsx` |
| `EmotionCheckinFlow.tsx` | Replaced by `EmotionCheckinFlowV2.tsx` |
| `EmotionsAnalyticsPage.tsx` | Replaced by `EmotionsAnalyticsPageV2.tsx` |
| `EmotionsStrategiesPage.tsx` | Replaced by `EmotionsStrategiesPageV2.tsx` |
| `EmotionsQuickActions.tsx` | Replaced by `EmotionsQuickActionsV2.tsx` |
| `PatternsDashboard.tsx` | Replaced by `PatternsDashboardEnhanced.tsx` |
| `EmotionLabelSelector.tsx` | Not imported anywhere |
| `CheckinReminders.tsx` | Not imported anywhere |
| `EmotionQuadrantPicker.tsx` | Not imported anywhere |

### Tasks Module (6 files)
| File | Reason |
|---|---|
| `TasksClockCard.tsx` | Not imported anywhere |
| `LargeClockWidget.tsx` | Not imported anywhere |
| `LuxuryClock.tsx` | Not imported anywhere |
| `AmbientClock.tsx` | Not imported anywhere |
| `CompactTimerClock.tsx` | Not imported anywhere |
| `CompactTimerWidget.tsx` | Not imported anywhere |
| `TasksInsights.tsx` | Not imported anywhere |
| `TimeToolsPanel.tsx` | Not imported anywhere |
| `SummaryStrip.tsx` | Not imported anywhere |
| `QuadrantToolbar.tsx` | Not imported anywhere |

### Notes Module (2 files)
| File | Reason |
|---|---|
| `NotesFilterPanel.tsx` | Not imported anywhere |
| `NotesNewNoteDialog.tsx` | Not imported anywhere |

### Manifest Module (1 file)
| File | Reason |
|---|---|
| `ManifestWeeklyPanel.tsx` | Not imported anywhere |

### Trackers Module (1 file)
| File | Reason |
|---|---|
| `ActivityDetailPanel.tsx` | Not imported anywhere |

### Common/Editor (2 files)
| File | Reason |
|---|---|
| `SkeletonCard.tsx` | Not imported anywhere |
| `ContentTransition.tsx` | Not imported anywhere |
| `ImageControlsOverlay.tsx` | Not imported anywhere |

### Other (1 file)
| File | Reason |
|---|---|
| `StrategiesPanel.tsx` | Not imported anywhere (replaced by `StrategiesPanelEnhanced.tsx`) |

### Pages (1 file)
| File | Reason |
|---|---|
| `Index.tsx` | Not imported anywhere; the `/` route redirects to `/diary` |

## Total: ~24 unused files to delete

## Technical Details
- No code modifications needed in any remaining files -- these are purely orphaned files with zero imports
- The V2/Enhanced versions are already fully wired into the app; the originals are just leftover copies
- Deletion is safe and will reduce bundle size and codebase noise

