# Task Dependency Indicators - Visual Guide

## Overview

The calendar displays visual indicators in task titles to show dependency information at a glance. This helps project managers and supervisors quickly understand task relationships without opening individual task dialogs.

**Note**: Dependency indicators are only visible to users with project management roles (Admin, Manager, Supervisor) or users with project management permissions. Regular team members and viewers will see a clean calendar view without dependency indicators.

## Indicator Symbols

### Dependency Type Indicators

| Symbol | Type | Meaning | Example |
|--------|------|---------|---------|
| 🔗 | FS | Finish-to-Start | Task starts after predecessor finishes |
| ⚡ | SS | Start-to-Start | Task starts when predecessor starts |
| 🎯 | FF | Finish-to-Finish | Task finishes when predecessor finishes |
| 🔄 | SF | Start-to-Finish | Task finishes when predecessor starts |

### Additional Indicators

| Symbol | Meaning | When Shown |
|--------|---------|------------|
| ⏱️ | Lag Days | Any dependency has buffer time |
| 📋 | Total Dependencies | Shows count of all dependencies |
| 🎯 | Milestone | Task is marked as milestone |

## Examples

### Simple FS Dependency
```
Foundation Work 🔗 (25%)
```
- Has 1 Finish-to-Start dependency
- 25% progress

### Multiple Dependencies
```
Walls Construction 🔗⚡📋3 (50%)
```
- Has Finish-to-Start dependencies
- Has Start-to-Start dependencies  
- Total of 3 dependencies
- 50% progress

### Dependencies with Lag
```
Roof Installation 🔗⏱️ (0%)
```
- Has Finish-to-Start dependency
- Has lag days (buffer time)
- 0% progress

### Milestone Task
```
Project Completion 🎯 (100%)
```
- Milestone task
- 100% progress

### Complex Task
```
Final Inspection 🔗⚡🎯🔄⏱️📋5🎯 (75%)
```
- Has all dependency types (FS, SS, FF, SF)
- Has lag days
- Total of 5 dependencies
- Is a milestone
- 75% progress

## Legend Location

The dependency legend is displayed in the calendar header alongside the status legend, but only for users who can see dependency indicators:

```
Status Legend:    [Blue] Planned [Green] In Progress [Gray] Done [Red] Blocked [Yellow] Delayed
Dependency Legend: 🔗 FS ⚡ SS 🎯 FF 🔄 SF ⏱️ Lag 📋 Deps 🎯 Milestone
```

### Toggle Control

Users with project management roles can toggle dependency indicators on/off using the "Show Deps" / "Hide Deps" button in the calendar header. This allows them to switch between detailed dependency view and clean task view as needed.

## Benefits

### For Project Managers
- **Quick Overview**: See all task relationships at a glance
- **Dependency Density**: Identify tasks with many dependencies
- **Lag Detection**: Spot tasks with buffer time requirements
- **Milestone Tracking**: Easily identify key project milestones

### For Team Members (when indicators are visible)
- **Context Awareness**: Understand task relationships without opening dialogs
- **Planning**: See which tasks depend on others
- **Coordination**: Identify tasks that need to start/end together

### For Stakeholders
- **Project Complexity**: Visual representation of project interdependencies
- **Risk Assessment**: Identify critical path tasks with many dependencies
- **Progress Tracking**: See milestone completion status

### For Regular Users
- **Clean Interface**: No dependency indicators cluttering the view
- **Focus on Tasks**: See only essential task information
- **Simplified Experience**: Less cognitive load for day-to-day work

## Best Practices

### Using Indicators Effectively
1. **Review Legend**: Familiarize yourself with all indicator meanings
2. **Check Dependencies**: Look for tasks with multiple dependency indicators
3. **Monitor Lag**: Pay attention to ⏱️ indicators for buffer time
4. **Track Milestones**: Use 🎯 indicators to identify key deliverables

### Task Management
1. **High Dependency Tasks**: Tasks with 📋3+ may need extra attention
2. **Lag Tasks**: Tasks with ⏱️ require careful scheduling
3. **Milestone Tasks**: 🎯 tasks are critical for project success
4. **Mixed Dependencies**: Tasks with multiple types (🔗⚡🎯🔄) need coordination

## Troubleshooting

### Missing Indicators
- **No indicators**: Task has no dependencies
- **Check task dialog**: Verify dependencies are properly set
- **Refresh calendar**: Reload if indicators don't appear

### Confusing Indicators
- **Multiple symbols**: Task has multiple dependency types
- **Numbers**: Show count when more than 1 of same type
- **Legend reference**: Use header legend to decode symbols

### Performance
- **Many indicators**: Tasks with many dependencies may show longer titles
- **Calendar view**: Switch to list view for detailed dependency information
- **Task dialog**: Open individual tasks for complete dependency details

## Technical Notes

### Indicator Generation
- Indicators are automatically generated from task dependency data
- Symbols are added to task titles in calendar view only
- List view shows full dependency information in details panel
- Indicators are only shown to users with appropriate permissions

### Data Source
- Indicators reflect current task dependency configuration
- Changes in task dialog immediately update calendar indicators
- Indicators are generated client-side for performance
- Visibility is controlled by user role and permissions

### Compatibility
- Works with all dependency types (FS, SS, FF, SF)
- Supports legacy dependency format
- Compatible with lag days and milestone markers
- Role-based visibility system

### User Role Access
- **Admin**: Full access to all indicators and toggle control
- **Manager**: Full access to all indicators and toggle control
- **Supervisor**: Full access to all indicators and toggle control
- **Engineer**: No indicators shown (clean interface)
- **Viewer**: No indicators shown (clean interface)

---

*This visual indicator system enhances the calendar view by providing immediate dependency context without requiring users to open individual task dialogs.*
