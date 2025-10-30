# Projects – Admin User Manual (Read‑Only)

Audience: System Administrators.

Admin sees a global, read‑only projects experience with server‑side pagination, filtering and a dedicated overview page per project.

## Navigation
- Header → All Projects
- All projects list: `/projects`
- Project overview (read‑only): `/projects/:id/admin`

## All Projects (Admin)
- Server search (300ms debounce): `search`
- Server filters: `status`, `priority`
- Server sort: `sort_by`, `sort_order` (e.g., `prj_name`, `priority`)
- Server pagination: `page`, `limit`
- Columns: Project, Client (address), Status, Priority, Manager, Created by
- Action: Details → opens the Admin overview page
- “Create Project” is hidden for Admin

## Project Overview (Read‑Only)
- Summary: name, address, status, priority, dates, manager, created by
- Analytics: task counters (Total/Completed/In Progress/Pending)
- Timeline: simple, non‑interactive Gantt‑like list (sequence only)
- Activity History: recent high‑level events (read‑only)
- Communication: placeholders to contact PM (no actions yet)

## Not Permitted for Admin
- Creating or editing projects
- Editing tasks or project structure

## Tips
- Use filters for quick triage by status/priority
- Use the overview to assess state before contacting the PM
- “All Projects” label confirms global scope

## Troubleshooting
- Empty overview: refresh; demo data may appear if API returns no data
- Details opens PM view: ensure URL includes `/admin`
- Search not filtering: pause typing (debounce) and check network requests
