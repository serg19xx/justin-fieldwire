# Admin Settings – User Manual

Audience: Administrators

Purpose: Configure automated event rules and message templates used across the application.

Contents
- Event Rules
- Message Templates

General UI
- Filters sit on top of each table to narrow results.
- Actions appear at the right of each row: Preview/Edit/Delete where applicable.
- System items are read-only; custom items are user-created and editable.

────────────────────────────────────────

Event Rules

What it is
- A rule reacts to a system event (e.g., TASK_CREATED) and triggers one or more actions.
- System rules are pre-defined and cannot be deleted. Custom rules are created by users.

Key columns
- Event Type: Event identifier in UPPER_SNAKE_CASE.
- Rule Type: system or custom.
- Status: Active/Inactive.
- Execution: Where the rule executes (Server/N8N/Both/Auto).
- Updated: Last update date.

Filtering
- Rule Type: system/custom.
- Status: Active/Inactive.
- Execution Location: Server/N8N/Both/Auto.
- Search Event Type: substring match in event type.

Create/Edit Rule
1) Click Create Rule or Edit on a row.
2) Fill fields:
   - Event Type (required): UPPER_SNAKE_CASE, e.g., PROJECT_CREATED.
   - Rule Enabled: toggle on/off.
   - Severity: Important/Critical.
   - Priority: Auto, or explicit Critical/High/Normal/Low.
   - Execution Location: Server/N8N/Both or Auto.
   - Comment: optional description.
3) Actions (at least one required):
   - Notify
     - Channels: Email/SMS/Push/Webhook/Slack (select one or more).
     - Channel templates (Email/SMS only): choose a message template ID or leave default.
     - Store for dashboard: flag to persist notification metadata for dashboards.
   - Create Report
     - Period: Daily/Weekly/Monthly/Quarterly/Custom (specify ISO-like period e.g., P7D).
     - Recipients: select roles to receive the report.
     - Store for dashboard: same as above.
   - Log Only
     - Store for dashboard: flag only; no outward notification.
4) Conditions (optional, can combine):
   - Strict mode: when on, all selected conditions must be met.
   - Notify Roles: select one or more roles; set priority (Required/Preferred/Optional).
   - Time Conditions: timezone, business-hours/weekdays flags, and time range (start/end).
   - Project Conditions: min budget, statuses.
   - Task Conditions: statuses and overdue-only flag.
5) Save. Rules require at least one action; otherwise saving is blocked.

Edit/Delete
- Edit: allowed for any rule. For system rules, deletion is disabled.
- Delete: allowed ONLY for custom rules. System rules cannot be deleted.

Notes
- If a Notify action exists, at least one role must be selected in Notify Roles.
- Time range fields are normalized; missing values default to 09:00–17:00 in the chosen timezone.

────────────────────────────────────────

Message Templates

What it is
- Reusable content for notifications (Email/SMS). These can be attached to Notify actions in Event Rules.

Key columns
- Name
- Category: system/custom (system templates are read-only)
- Type: Email/SMS
- Status: Active/Inactive
- Created: creation date

Filtering
- Category: system/custom
- Type: email/sms

Create/Edit Template
1) Click Create Template or Edit on a row.
2) Fill fields:
   - Template Name (required)
   - Type (required): Email or SMS
   - Email Subject (required for Email)
   - Template Content (required):
     - Supports plain text and HTML tags.
     - Variables are written as {{VARIABLE_NAME}}.
     - Quick toolbar (Email): basic tags like strong/em, p, br, h2/h3, ul/ol, span, div, link.
3) Variables
   - Variables are auto-detected from content by scanning {{...}} placeholders.
   - In the Variables section you can set a readable label for each variable.
   - These labels are saved and sent to the server with the template.
4) Status
   - Active toggle to enable/disable the template.
5) Preview
   - Use Show Preview to view rendered HTML (Email) or plain text (SMS).
6) Save
   - Category is always saved as custom for user-created templates.

Delete
- Allowed ONLY for custom templates; system templates cannot be deleted or edited.

Variables
- Syntax: {{VARIABLE_NAME}} (UPPER_SNAKE_CASE recommended, but alphanumeric/underscore allowed).
- Examples: {{PROJECT_NAME}}, {{TASK_NAME}}, {{ASSIGNEE_NAME}}, {{DUE_DATE}}, {{CREATED_BY}}
- On save, variables are included in the payload as a map of { key: label }.

Best Practices
- Keep template names descriptive (e.g., "Task Assigned – Email").
- Prefer simple, semantic HTML for Email templates (headings, paragraphs, lists).
- Avoid heavy styling; the template will be wrapped by a parent email layout (logo, header, footer).
- Use variables consistently and keep labels human-readable.

Troubleshooting
- 400 Bad Request on save: check required fields (Type, Name, Body; Subject for Email). Ensure at least one variable label is not empty when variables exist.
- System template is not editable: this is by design; duplicate it by creating a custom template with changes.
- Preview shows raw text: ensure you are editing an Email template and preview is enabled; HTML is rendered via v-html.

Security
- Do not include inline scripts or untrusted HTML.
- Variables are treated as plain text in your content; ensure any external values are sanitized server-side on delivery.


