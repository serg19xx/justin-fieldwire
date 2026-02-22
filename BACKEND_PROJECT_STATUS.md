# Backend: Project Status Values (POST/PUT /api/v1/projects)

The frontend sends and displays these **project status** values. The backend must accept them for `POST /api/v1/projects` and `PUT /api/v1/projects/:id` (no enum restriction, or extend the enum to include these).

## Allowed status values (exact strings)

- `Initial Contact Lead`
- `Dead Lead`
- `Waiting On Direction`
- `Actively Looking For A Location`
- `Securing Location`
- `Project Secured`
- `Construction`
- `Completed Project`

If the backend validates `status` against a fixed list (e.g. only `Active`, `Pending`, `Planning`, `Completed`), it will return **400 Bad Request** when the frontend sends one of the values above. Fix: allow these strings in the project create/update validation (or store as free text).
