# Plan: Task Filtering and List Sidebar

## Goals
1. Add comprehensive task filtering (dates, status, type, category, etc.)
2. Create a shared task list sidebar component
3. Integrate list sidebar with Calendar and List views
4. Keep Gantt view independent (has its own integrated list)

## Architecture

### 1. Enhanced Filtering System

**Location:** `src/core/types/task.ts` - extend `TaskFilter` interface

**New Filter Options:**
- Worker/Assignee (existing, expand)
- Date range (start date, end date)
- Status (multiple selection)
- Task type (Task vs Milestone)
- Category
- Search by name/notes
- WBS path (existing)

### 2. Components Structure

```
src/components/tasks/
├── TaskFilterPanel.vue      # Filter controls panel
├── TaskListSidebar.vue     # Shared task list component
└── TaskFilterState.ts      # Shared filter state composable
```

### 3. Implementation Steps

#### Step 1: Extend TaskFilter Interface
- Add missing filter fields
- Support multiple selections
- Date range filtering

#### Step 2: Create TaskFilterPanel Component
- Worker/Assignee selector
- Status multi-select
- Date range pickers
- Type selector (Task/Milestone/All)
- Category filter
- Search input
- Clear filters button

#### Step 3: Create TaskListSidebar Component
- Compact task list view
- Click to select task
- Show task name, dates, status
- Highlight selected task
- Scrollable list
- Task count display

#### Step 4: Create Shared Filter State
- Composable for filter state management
- Reactive filter application
- Filter persistence (optional)

#### Step 5: Integrate with Views
- Calendar view: List sidebar on left, calendar on right
- List view: List sidebar on left, detail view on right
- Gantt view: Keep as is (has integrated list)

## Layout Structure

### Calendar View
```
┌─────────────────────────────────────────┐
│ Header (filters, view toggles)         │
├──────────┬─────────────────────────────┤
│          │                              │
│ Task     │  Calendar                    │
│ List     │  (FullCalendar)              │
│ Sidebar  │                              │
│          │                              │
└──────────┴─────────────────────────────┘
```

### List View
```
┌─────────────────────────────────────────┐
│ Header (filters, view toggles)         │
├──────────┬─────────────────────────────┤
│          │                              │
│ Task     │  Task Detail View           │
│ List     │  (selected task details)    │
│ Sidebar  │                              │
│          │                              │
└──────────┴─────────────────────────────┘
```

### Gantt View
```
┌─────────────────────────────────────────┐
│ Header (filters, view toggles)         │
├─────────────────────────────────────────┤
│                                          │
│  Gantt Chart (with integrated list)     │
│                                          │
└─────────────────────────────────────────┘
```

## Filter Panel UI

```
┌─────────────────────────┐
│ 🔍 Search tasks...      │
├─────────────────────────┤
│ 👤 Worker: [All ▼]     │
│ 📊 Status: [✓] Planned │
│        [ ] In Progress │
│        [ ] Done        │
├─────────────────────────┤
│ 📅 Start Date: [date]   │
│ 📅 End Date: [date]     │
├─────────────────────────┤
│ 🎯 Type: [All ▼]       │
│        Task            │
│        Milestone        │
├─────────────────────────┤
│ 📁 Category: [All ▼]  │
├─────────────────────────┤
│ [Clear Filters]         │
└─────────────────────────┘
```

## Task List Sidebar UI

```
┌─────────────────────────┐
│ Tasks (25)              │
├─────────────────────────┤
│ ✓ Foundation Work       │
│   Jan 15 - Jan 20       │
│   🟢 In Progress        │
├─────────────────────────┤
│   Framing               │
│   Jan 21 - Jan 25       │
│   🔵 Planned            │
├─────────────────────────┤
│ 🎯 Inspection           │
│   Jan 26                │
│   🟡 Scheduled          │
└─────────────────────────┘
```

## Implementation Order

1. ✅ Extend TaskFilter interface
2. ✅ Create filter composable (TaskFilterState.ts)
3. ✅ Create TaskFilterPanel component
4. ✅ Create TaskListSidebar component
5. ✅ Update ProjectCalendar to use new components
6. ✅ Test filtering in Calendar view
7. ✅ Test filtering in List view
8. ✅ Ensure Gantt view still works independently

## Notes

- Filter state should be shared across Calendar and List views
- Gantt view can have its own filter or use shared one
- Consider saving filter preferences to localStorage
- Mobile responsive design for filter panel (collapsible)

