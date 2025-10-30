# Team – User Manual (Admin and Project Manager)

Audience: Customer users who manage people in the system.

This guide explains how to work with the Team section for two primary roles: System Administrator (Admin) and Project Manager (PM). Workers see a simplified, read‑only view with only minor differences from PM.

## Navigation
- Global header → Team
- URL: `/team`

## Shared Concepts (Admin and PM)
- Search builders/workers by name, email, or job title
- Filter by Role, User Status (Active/Inactive), and Invitation Status (Registered/Invited/Expired)
- View Registered vs Pending (Invited) users
- Responsive table/cards with key attributes: name, contact, role, status, languages, cultural group
- Open user details modal with personal and professional info

## Admin Capabilities
- Scope: All workers in the system (global view)
- Invite new workers: “+ Add Worker” opens an invitation dialog
  - Required fields: first name, last name, email, user type (role)
  - Optional: specialization (for certain roles), phone
  - The invite is sent with `invited_by` set to current admin user
- Filter/search across the entire database of workers
- Can switch between Registered and Pending to audit onboarding

## PM Capabilities
- Scope: Workers relevant to the PM’s project(s)
- Invite new workers: “+ Add Worker” opens an invitation dialog
  - Same required/optional fields as Admin
  - The invite is sent with `invited_by` set to the current PM user
- Filter/search within the PM’s scoped dataset
- Registered/Pending split for project onboarding

## Minor Differences for Workers
- Read‑only: cannot invite or edit
- Can review own details and limited team info

## Tips
- Use Registered/Pending toggle to manage onboarding pipeline
- Combine filters (Role + Invitation Status) for precise views
- Keep invitations consistent with appropriate user types and specializations

## Troubleshooting
- “Add Worker” button missing: only Admins and PMs can invite
- Invitation not delivered: verify email format and spam folder
- Incorrect role shown: check selected user type in the dialog


