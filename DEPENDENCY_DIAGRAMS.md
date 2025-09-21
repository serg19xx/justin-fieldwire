# Task Dependencies - Visual Diagrams

## Dependency Types Visualization

### 1. Finish-to-Start (FS)
```
Task A: [████████] (Jan 1-5)
Task B:         [████████] (Jan 6-10)
                ↑
            B starts after A finishes
```

**Example**: Foundation → Walls
- Foundation must be complete before walls can start
- Most common dependency type

### 2. Start-to-Start (SS)
```
Task A: [████████] (Jan 1-5)
Task B: [████████████] (Jan 1-8)
        ↑
    B starts when A starts
```

**Example**: Site Preparation → Equipment Setup
- Both tasks can start simultaneously
- Useful for parallel work

### 3. Finish-to-Finish (FF)
```
Task A: [████████] (Jan 1-5)
Task B:     [████████] (Jan 3-7)
                    ↑
            B finishes when A finishes
```

**Example**: Electrical Installation ↔ Plumbing Installation
- Both must complete together
- Coordinated finish required

### 4. Start-to-Finish (SF)
```
Task A: [████████] (Jan 1-5)
Task B: [████] (Jan 1-3)
            ↑
        B finishes when A starts
```

**Example**: New System Activation → Old System Shutdown
- Old system must shut down when new system starts
- Handoff scenario

## Lag Days Examples

### FS with 2-Day Lag
```
Task A: [████████] (Jan 1-5)
Task B:           [████████] (Jan 8-12)
                  ↑
              2-day buffer
```

### SS with 1-Day Lag
```
Task A: [████████] (Jan 1-5)
Task B:  [████████] (Jan 2-6)
         ↑
      1-day buffer
```

## Cascade Movement Example

### Original Schedule
```
Task A: [████████] (Jan 1-5)    Foundation
Task B:         [████████] (Jan 6-10)   Walls (FS on A)
Task C:             [████████] (Jan 11-15)  Roof (FS on B)
```

### Move Task A to Jan 3-7
```
Task A:     [████████] (Jan 3-7)    Foundation (moved)
Task B:             [████████] (Jan 8-12)   Walls (auto-suggested)
Task C:                 [████████] (Jan 13-17)  Roof (auto-suggested)
```

**Result**: All dependent tasks automatically suggest new positions

## Project Timeline with Dependencies

```
Project Timeline: Jan 1 ────────────────────────── Jan 31

Task A: [████████] (Jan 1-5)     Foundation
Task B:         [████████] (Jan 6-10)    Walls (FS on A)
Task C: [████████] (Jan 1-8)     Site Prep
Task D: [████████████] (Jan 1-12)  Equipment (SS on C)
Task E:             [████████] (Jan 11-15)  Roof (FS on B)
Task F:                 [████████] (Jan 16-20)  Finishing (FS on E)

Dependencies:
- B depends on A (FS)
- D depends on C (SS)
- E depends on B (FS)
- F depends on E (FS)
```

## Validation Flow Diagram

```
User Moves Task
        ↓
Check Project Bounds
        ↓
    Within Bounds?
    ↙        ↘
   Yes        No
    ↓          ↓
Check Dependencies    Show "Project Bounds" Dialog
        ↓
   Valid Dependencies?
    ↙        ↘
   Yes        No
    ↓          ↓
Update Task    Show "Dependency Constraint" Dialog
        ↓
Check Dependent Tasks
        ↓
Show Warnings (if any)
        ↓
Task Updated Successfully
```

## Calendar Interaction States

### Normal State
```
[Task A] [Task B] [Task C]
   ↓        ↓        ↓
  Editable  Editable  Editable
```

### After Moving Task A
```
[Task A] [Task B] [Task C]
   ↓        ↓        ↓
  Moved   Warning   Warning
         (needs     (needs
         update)    update)
```

### After Validation
```
[Task A] [Task B] [Task C]
   ↓        ↓        ↓
  Updated  Updated  Updated
  (new     (auto    (auto
  position) adjusted) adjusted)
```

## Error States

### Project Bounds Violation
```
Project: [████████████████████████████] (Jan 1-31)
Task:                    [████████████████████████████████] (Jan 20-40)
                         ↑
                    Outside bounds
```

### Dependency Violation
```
Task A: [████████] (Jan 1-5)
Task B: [████████] (Jan 1-5)  ← Violates FS dependency
        ↑
    Should start after A finishes
```

### Circular Dependency
```
Task A → Task B → Task C → Task A
  ↑                           ↓
  └───────────────────────────┘
        Circular reference
```

## Success States

### Valid Dependencies
```
Task A: [████████] (Jan 1-5)
Task B:         [████████] (Jan 6-10)  ✓ Valid FS
Task C:             [████████] (Jan 11-15)  ✓ Valid FS
```

### Cascade Movement Success
```
Before:
Task A: [████████] (Jan 1-5)
Task B:         [████████] (Jan 6-10)

After Moving A:
Task A:     [████████] (Jan 3-7)
Task B:             [████████] (Jan 8-12)  ✓ Auto-adjusted
```

---

*These diagrams illustrate the core concepts of task dependencies. Use them as visual aids when explaining the system to users.*
