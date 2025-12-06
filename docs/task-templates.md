# Task Templates Feature

## Overview

The Task Templates feature allows project managers to create tasks quickly from predefined templates. This significantly speeds up project setup and ensures consistency across similar projects.

## Key Benefits

### 1. **Standardization**
- Consistent task naming across all projects
- Standardized task structure and organization
- Ensures all necessary tasks are included

### 2. **Time Savings**
- Create multiple tasks at once instead of one-by-one
- Pre-filled information (names, durations, categories)
- Automatic date calculation based on project start date

### 3. **Smart Date Calculation**
- Tasks can have relative start dates (e.g., "5 days after project start")
- Automatic end date calculation based on duration
- Maintains proper task sequencing

### 4. **Flexibility**
- Override any template value before creating tasks
- Assign different foremen to different tasks
- Adjust dates and durations as needed

### 5. **Knowledge Base**
- Templates accumulate project experience
- Reusable across multiple projects
- Can be organized by categories (Foundation, Framing, etc.)

## How It Works

### Step 1: Select Templates
1. Click "📋 From Templates" button in the Tasks section
2. Browse available templates (searchable and filterable by category)
3. Select one or more templates (can select all 30+ if needed)
4. Click "Continue"

### Step 2: Configure Tasks
1. Set project start date (used for calculating all task dates)
2. Optionally set default foreman (applied to all tasks, can be overridden)
3. Review each task:
   - Adjust start date offset if needed
   - Adjust duration if needed
   - Assign specific foreman if different from default
4. Preview calculated dates for each task

### Step 3: Create Tasks
1. Review validation (all required fields must be filled)
2. Click "Create X Tasks"
3. All tasks are created at once
4. Tasks appear in calendar/Gantt view immediately

## Template Structure

Each template contains:
- **Name**: Task name (required)
- **Description**: Optional description
- **Category**: For organization (e.g., "Foundation", "Framing")
- **Duration**: Number of days (optional, can be set during creation)
- **Start Offset**: Days from project start (null = must be set manually)
- **End Offset**: Alternative to duration (optional)
- **Milestone Type**: If this is a milestone task
- **Status**: Default status (usually "planned")
- **Notes**: Additional notes
- **WBS Path**: Work breakdown structure path
- **Task Order**: Order in sequence

## Template Storage

Templates are stored in:
- **Primary**: Backend API (when available) - `/api/v1/task-templates`
- **Fallback**: LocalStorage - for offline access and before backend is ready

## Initialization

Default templates are automatically initialized on first use. To reset to defaults:

```typescript
import { resetTemplatesToDefaults } from '@/core/utils/task-templates-init'

await resetTemplatesToDefaults()
```

## API Integration

The system supports both:
1. **Backend API** (preferred): Templates stored in database
2. **LocalStorage** (fallback): Templates stored locally in browser

The API automatically tries backend first, falls back to localStorage if backend is unavailable.

## Use Cases

### New Project Setup
1. Create new project
2. Set project start date
3. Open "From Templates"
4. Select relevant templates (e.g., all Foundation tasks)
5. Configure dates and foremen
6. Create all tasks at once

### Adding Standard Tasks
1. Project already has some tasks
2. Need to add standard set (e.g., all Finishing tasks)
3. Select templates
4. Set start date offset to match current project timeline
5. Create tasks

### Template Management
- Templates can be created, edited, and deleted
- Categories help organize large template libraries
- Templates accumulate over time as projects are completed

## Advantages Over Manual Creation

Even if you need to fill 50% of information manually, templates provide:

1. **Structure**: You know which tasks to create
2. **Naming**: Consistent, professional task names
3. **Duration Estimates**: Realistic duration estimates from experience
4. **Sequence**: Proper task ordering
5. **Speed**: Create 30 tasks in 2 minutes vs 30 minutes manually
6. **Accuracy**: Less chance of forgetting tasks or making typos

## Importing Tasks from TSV File

You can import tasks from a TSV (Tab-Separated Values) file directly into the template system.

### File Format

The TSV file should have the following columns:
- **Task Name** (required): Name of the task
- **Duration** (optional): Duration in days (can be decimal like 0.5)
- **Status** (optional): Task status (defaults to "planned")
- **Dependencies** (optional): Task dependencies

### Import Process

1. Open the "From Templates" dialog
2. In the import section at the top, click "Choose File"
3. Select your TSV file
4. Wait for import to complete
5. Templates will appear in the list below

### Automatic Processing

The import system automatically:
- **Categorizes tasks** based on keywords (HVAC, Plumbing, Electrical, etc.)
- **Identifies milestones** (meetings, inspections, visits)
- **Calculates start offsets** based on task sequence
- **Preserves task order** from the file

### Example Categories

Tasks are automatically categorized into:
- Planning & Design
- Permits & Approvals
- Demolition & Site Prep
- HVAC
- Plumbing
- Electrical
- Sprinkler
- Framing & Structure
- Drywall
- Painting
- Millwork
- Doors & Hardware
- Ceiling
- Flooring
- Fixtures & Equipment
- Finishing
- Materials & Ordering
- Network & IT
- Roofing
- Branding & Signage
- Cleaning
- Other

## Future Enhancements

Potential improvements:
- Template dependencies (automatically create dependent tasks)
- Template sets (predefined groups of templates)
- Template export
- Template versioning
- Template sharing between projects
- AI-suggested templates based on project type

