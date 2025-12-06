# Task Templates Mock Data

## Overview

The system includes mock data for task templates that can be used during development and later imported into the database.

## Location

Mock data is stored in:
- **File**: `src/core/mock-data/task-templates.json`
- **Loader**: `src/core/mock-data/task-templates-loader.ts`
- **Source**: Generated from `migrations/Task List.tsv`

## Data Structure

The JSON file contains an array of task template objects:

```json
{
  "name": "Client Business Planning Meeting 1",
  "category": "Planning & Design",
  "duration_days": 3,
  "start_offset_days": 0,
  "milestone": "meeting",
  "status": "planned",
  "task_order": 1
}
```

## Usage

### Automatic Loading

Mock data is automatically loaded when:
1. No templates exist in localStorage
2. API endpoint is not available
3. User opens template selector for the first time

### Manual Loading

To manually load mock templates:

```typescript
import { initializeDefaultTemplates } from '@/core/utils/task-templates-init'

await initializeDefaultTemplates()
```

## Regenerating Mock Data

If you need to regenerate mock data from TSV file:

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('migrations/Task List.tsv', 'utf-8');
// ... (use the script from generate-task-templates.ts logic)
"
```

Or use the import utility:

```typescript
import { importTasksFromTSV } from '@/core/utils/task-templates-import'

const tsvContent = fs.readFileSync('migrations/Task List.tsv', 'utf-8')
await importTasksFromTSV(tsvContent)
```

## Database Migration

### Step 1: Create Database Table

```sql
CREATE TABLE task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  duration_days INTEGER,
  start_offset_days INTEGER,
  end_offset_days INTEGER,
  milestone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'planned',
  notes TEXT,
  wbs_path VARCHAR(100),
  task_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_task_order ON task_templates(task_order);
```

### Step 2: Import Mock Data

#### Option A: Using SQL Script

Create a migration script that reads the JSON and generates INSERT statements:

```sql
-- Example (you'll need to generate full script from JSON)
INSERT INTO task_templates (name, category, duration_days, start_offset_days, milestone, status, task_order)
VALUES
  ('Client Business Planning Meeting 1', 'Planning & Design', 3, 0, 'meeting', 'planned', 1),
  ('Client Business Planning Meeting 2', 'Planning & Design', 3, 3, 'meeting', 'planned', 2),
  -- ... (all 206 templates)
;
```

#### Option B: Using Backend API

Create an endpoint to import templates:

```typescript
// Backend endpoint
POST /api/v1/task-templates/import
Body: { templates: TaskTemplate[] }

// Frontend call
const mockTemplates = getMockTaskTemplates()
await api.post('/api/v1/task-templates/import', { templates: mockTemplates })
```

#### Option C: Using Database Migration Tool

If using a migration tool (like Knex, TypeORM, etc.):

```typescript
// migration file
import taskTemplatesData from '../mock-data/task-templates.json'

export async function up(knex) {
  await knex('task_templates').insert(
    taskTemplatesData.map(t => ({
      ...t,
      created_at: new Date(),
      updated_at: new Date(),
    }))
  )
}
```

### Step 3: Update API to Use Database

Once data is in database, update `task-templates-api.ts` to prioritize database over mock data:

```typescript
async getAll(): Promise<TaskTemplate[]> {
  // 1. Try database API first
  try {
    const response = await api.get('/api/v1/task-templates')
    if (response.data?.data?.templates?.length > 0) {
      return response.data.data.templates
    }
  } catch (error) {
    // API not available, continue to fallbacks
  }

  // 2. Try localStorage
  const stored = localStorage.getItem(LOCAL_TEMPLATES_KEY)
  if (stored) {
    const parsed = JSON.parse(stored)
    if (parsed.length > 0) return parsed
  }

  // 3. Fallback to mock data (only if no other source)
  return getMockTaskTemplates()
}
```

## Statistics

Current mock data includes:
- **Total Templates**: 206
- **Categories**: 20+
- **Milestones**: ~50+ (meetings, inspections, visits, reviews)

### Category Breakdown

- Planning & Design: ~30 tasks
- HVAC: ~10 tasks
- Plumbing: ~15 tasks
- Electrical: ~10 tasks
- Flooring: ~20 tasks
- Finishing: ~15 tasks
- Materials & Ordering: ~25 tasks
- And more...

## Maintenance

### Updating Mock Data

1. Update `migrations/Task List.tsv` with new tasks
2. Regenerate JSON file using the script
3. Test that templates load correctly
4. Update database if needed

### Version Control

- Mock data is committed to git
- JSON file should be updated when TSV source changes
- Keep TSV as source of truth

## Best Practices

1. **Use Mock Data for Development**: Faster iteration, no database needed
2. **Test with Real Data**: Before production, test with actual database
3. **Keep TSV Updated**: Maintain TSV file as source of truth
4. **Version Mock Data**: Consider versioning if structure changes significantly

