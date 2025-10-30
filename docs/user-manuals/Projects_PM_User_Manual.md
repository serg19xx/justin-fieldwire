# Projects – Project Manager User Manual

Audience: Project Managers.

PM manages projects and can create/edit where permitted. The PM view differs significantly from Admin’s read‑only experience.

## Navigation
- Header → Projects
- Projects list: `/projects`
- Project detail (PM): `/projects/:id/detail`

## Projects List (PM)
- Client‑side search and filters (status/role, etc.)
- Pagination and page size controls
- Columns: Project, Client (address), Status, Priority, Manager
- Actions: Details (opens PM view), Edit (where allowed)
- Create Project button is visible for non‑admins

## Project Detail (PM)
- Overview: project info, dates, status, priority
- Team: manage team members, invite with the “+ Add Worker” dialog
- Tasks: task lists, calendar/gantt views (as implemented in the app)
- Files/Photos/Reports: project artifacts

## Editing a Project (PM)
This section summarizes the core editing workflows. Exact UI labels may vary slightly; concepts remain the same.

### 1) Project Info
- Edit name, address, status, priority
- Set start/end dates (affects default task date bounds)
- Save applies changes immediately

### 2) Task Management (List View)
- Create task: title, description, status, assignees, dates
- Inline edits: change status/priority without leaving the list
- Bulk actions: multi‑select → status/assignee/date changes
- Filters: status, assignees, date range, WBS path
- Sorting: by priority, status, start/end date

### 3) Calendar View
- Visualize tasks by dates (week/month)
- Drag to reschedule (start/end)
- Resize to change duration
- Conflict hints: overlapping critical tasks are highlighted
- Quick create: click on a day to add a task

### 4) Gantt (Read/Plan)
- Timeline of tasks with dependencies
- Drag bars to shift start/end; drag edges to change duration
- Zoom (day/week/month)
- Critical path highlight (optional)

### 5) Dependencies (Predecessor → Successor)
- Types: Finish‑to‑Start (FS), Start‑to‑Start (SS), Finish‑to‑Finish (FF), Start‑to‑Finish (SF)
- Lag/Lead: add positive (lag) or negative (lead) offsets (e.g., +2d, −1d)
- Validation:
  - Detect and prevent circular dependencies
  - Warn on impossible schedules (successor starts before predecessor with no lead)
  - Respect task constraints (must‑start‑on, must‑finish‑on, no‑earlier‑than)
- Editing:
  - Add/remove links in task details
  - Drag link handles in Gantt (if enabled)

### 6) Milestones
- Zero‑duration tasks to mark major checkpoints
- Can be predecessors/successors in dependencies

### 7) Resources & Assignments
- Assign PM team members to tasks
- Capacity: avoid double‑booking (visual hints)
- Roles: PM, Architect, Contractor, etc.

### 8) Progress Tracking
- Status: Pending → In‑Progress → Completed → Blocked
- Percent complete (if available) updates progress bars
- Actual vs planned dates (slippage indicators)

### 9) Notifications & Collaboration
- Commenting on tasks (mentions, attachments)
- Change log: who changed what and when
- Admin read‑only: admins view PM data but cannot edit

### 10) Constraints & Validation Rules
- Date constraints: earliest start, latest finish
- Dependency rules as above
- Cross‑checks: task cannot finish before it starts; parent summary spans children

### 11) WBS (Work Breakdown Structure)
- Hierarchy of tasks and phases
- Roll‑up dates/progress to parent
- Collapse/expand levels; filter by WBS path

### 12) Baselines (optional)
- Capture a snapshot of the plan
- Compare current schedule to baseline (variance)

### 13) Reports and Exports
- Export task list (CSV/PDF)
- Print Gantt snapshot for status meetings

### 14) Keyboard/UX Shortcuts (if enabled)
- Enter: add next task
- Ctrl/Cmd+S: save changes
- Drag with Alt/Option: copy task (if supported)

### Best Practices
- Keep task dates realistic; avoid excessive overlap
- Use milestones to anchor releases/inspections
- Add dependencies sparingly; prioritize critical path
- Review weekly in Gantt; daily in List/Calendar

## Creating a Project
- Click “Create Project” on the list page
- Fill basic info and save
- After creation, configure team and tasks

## Inviting Workers
- Use “+ Add Worker” (Team) to invite by email, assign role and optional specialization/phone
- Invitations record the inviter automatically

## Differences vs Admin
- PM can create and edit projects; Admin is read‑only
- PM opens `/projects/:id/detail`; Admin opens `/projects/:id/admin`

## Tips
- Keep statuses updated to reflect real progress
- Use filters/search to quickly find active or pending projects
- Coordinate with Admin using the overview and reports

## Troubleshooting
- “Create Project” missing: ensure you are not logged in as Admin
- Cannot edit: check your role or project permissions
- Invite not delivered: verify email format and spam folder
