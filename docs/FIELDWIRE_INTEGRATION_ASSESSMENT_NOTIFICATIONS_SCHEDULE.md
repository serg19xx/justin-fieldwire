# Fieldwire repo — integration assessment: visits schedule & notifications TZ

Assessment of how the current **fieldwire** SPA/backend contract aligns with `docs/TZ_FIELD_VISITS_NOTIFICATIONS.md`. No code changes required for this document.

---

## 1. Existing assets

| Area | Location | Reuse |
|------|----------|--------|
| Task calendar / Gantt-style views | `src/pages/projects/ProjectCalendar.vue` | **Partial:** project-scoped task calendar; not user-centric “my week across projects.” |
| Task model (status, dates) | `src/core/types/task.ts`, `tasks-api.ts` | **Yes** for overdue / “not completed by end of day” rules once backend owns scheduling jobs. |
| Notify channel types | `src/core/types/event-rules.ts` (`NotifyChannel`: `email` \| `sms` \| `push` \| …) | **Yes** as **frontend/admin rule typing**; actual senders are backend/n8n per `execution_location`. |
| Admin templates hint | `src/pages/admin/components/MessageTemplates.vue` (email/SMS templates) | **Partial:** UI direction exists; product TZ needs backend template IDs and digest assembly. |
| Task-role mobile shell | `layouts/TaskLayout.vue`, `/tasks/*` routes | **Natural home** for “My week” screen for workers/foremen once API exists. |
| User / profile | `src/core/stores/auth.ts`, settings pages | **Extend** with notification preferences (master toggle, future channel flags). |

---

## 2. Gaps (backend-first)

| Requirement | Gap |
|-------------|-----|
| `UserSiteSchedule` (user + date + slot + project) | **No** first-class model/API referenced in SPA today. |
| Weekly digest / anti-spam aggregation | **No** client-only solution; requires **job queue**, templates, user prefs. |
| Global “notifications off” | Needs **persistent user flag** + enforcement on server (not only hiding UI). |
| Status prompt for overdue | Needs **state machine** + idempotent “one prompt per window” + optional deep links into task detail (`TaskTaskDetail.vue`). |

---

## 3. Suggested implementation order (in this codebase)

1. **API contract** (OpenAPI or internal doc): CRUD for `UserSiteSchedule`, query `GET /me/schedule?from=&to=`, user settings `PATCH /me/notification-preferences`.
2. **SPA — “My week”** view under task layout: consumes schedule API; empty states; links to `TaskProjects` / `TaskProjectDetail`.
3. **Wire task overview** (optional v2): cross-project task list filtered by “today’s scheduled `project_id`.”
4. **Admin / rules:** align `EventRule` actions with digest events (likely `execution_location: 'server' | 'n8n'` already in types).

---

## 4. Risk notes

- **SMS/push** increases compliance and vendor work; keep MVP to **email + in-app** per TZ defaults until customer sign-off.
- **Schedule vs tasks:** two sources of truth; avoid duplicate notifications by **single digest builder** on backend.

---

## 5. References

- Product TZ: `docs/TZ_FIELD_VISITS_NOTIFICATIONS.md`
- Event rule types: `src/core/types/event-rules.ts`
