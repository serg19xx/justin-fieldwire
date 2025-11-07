# Backend API Requirements for Tasks and Team Sections

## 1. API Endpoint for Available Workers (TaskEditPanel)

### Endpoint
```
GET /api/v1/tasks/{taskId}/available-workers
```

### Query Parameters
- `start_date` (required) - Start date of the task period (YYYY-MM-DD)
- `end_date` (required) - End date of the task period (YYYY-MM-DD)

### Request Example
```
GET /api/v1/tasks/47/available-workers?start_date=2025-01-01&end_date=2025-01-10
```

### Response Format
```json
{
  "status": "success",
  "data": {
    "workers": [
      {
        "id": 1,
        "user_id": 1,
        "first_name": "John",
        "last_name": "Smith",
        "full_name": "John Smith",
        "email": "john@example.com",
        "role_name": "Foreman",
        "role_code": "foreman",
        "avatar_url": "https://...",
        "status": 1
      }
    ]
  }
}
```

### Business Logic Requirements

1. **Get all users from system** (`fw_users` table)
   - Exclude users with `role_code = 'admin'`
   - Exclude users with `role_code = 'project_manager'`
   - Only include users with `status = 1` (active)

2. **Exclude already assigned workers**
   - Exclude workers who are in `team_members` array of the current task
   - Exclude worker who is `task_lead_id` of the current task

3. **Exclude busy workers (availability check)**
   - Check ALL projects and ALL tasks (not just current project)
   - Exclude workers who have overlapping date ranges in ANY task
   - Date overlap logic:
     - Task A: 2025-01-01 to 2025-01-10
     - Task B: 2025-01-05 to 2025-01-15
     - If worker is assigned to Task B, they are BUSY for Task A period
   - Check both `task_lead_id` and `team_members` fields
   - If task has no dates (`start_planned` or `end_planned` is NULL), skip it

### SQL Query Example (conceptual)
```sql
SELECT DISTINCT u.*
FROM fw_users u
WHERE u.role_code NOT IN ('admin', 'project_manager')
  AND u.status = 1
  AND u.id NOT IN (
    -- Already assigned to current task
    SELECT task_lead_id FROM fw_tasks WHERE id = ? AND task_lead_id IS NOT NULL
    UNION
    SELECT JSON_EXTRACT(team_members, '$[*]') FROM fw_tasks WHERE id = ?
  )
  AND u.id NOT IN (
    -- Busy in other tasks (all projects)
    SELECT DISTINCT task_lead_id 
    FROM fw_tasks 
    WHERE task_lead_id IS NOT NULL
      AND start_planned IS NOT NULL 
      AND end_planned IS NOT NULL
      AND id != ?
      AND (
        (start_planned <= ? AND end_planned >= ?) OR
        (start_planned <= ? AND end_planned >= ?) OR
        (start_planned >= ? AND end_planned <= ?)
      )
    UNION
    SELECT DISTINCT JSON_EXTRACT(team_members, '$[*]')
    FROM fw_tasks
    WHERE team_members IS NOT NULL
      AND start_planned IS NOT NULL
      AND end_planned IS NOT NULL
      AND id != ?
      AND (
        (start_planned <= ? AND end_planned >= ?) OR
        (start_planned <= ? AND end_planned >= ?) OR
        (start_planned >= ? AND end_planned <= ?)
      )
  )
```

### Notes
- Date overlap check should be inclusive (if dates touch, worker is busy)
- If `taskId` doesn't exist, return empty array
- If dates are invalid, return error 400

---

## 2. No Additional API Needed for Team Section

Team Section uses **frontend grouping**:
- Data is already loaded via:
  - `GET /api/v1/projects/{projectId}/team` - for team members
  - `GET /api/v1/projects/{projectId}/tasks` - for tasks
- Grouping is done on frontend (by worker or by task)
- No new endpoints needed

---

## Summary

**New endpoint needed:**
- `GET /api/v1/tasks/{taskId}/available-workers` - with availability check

**Existing endpoints used:**
- `GET /api/v1/projects/{projectId}/team` - for team members
- `GET /api/v1/projects/{projectId}/tasks` - for tasks

**No changes needed:**
- Team Section grouping (done on frontend)
- Task update/delete endpoints (already exist)

