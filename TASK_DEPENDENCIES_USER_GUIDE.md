# Task Dependencies and Calendar Management - User Guide

## Overview

The Fieldwire project management system includes a sophisticated task dependency system that automatically enforces project logic and maintains schedule integrity. This guide explains how task dependencies work and how to use them effectively.

## Table of Contents

1. [Understanding Task Dependencies](#understanding-task-dependencies)
2. [Dependency Types](#dependency-types)
3. [Lag Days](#lag-days)
4. [Setting Up Dependencies](#setting-up-dependencies)
5. [Calendar Interactions](#calendar-interactions)
6. [Cascade Movement](#cascade-movement)
7. [Validation System](#validation-system)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Understanding Task Dependencies

Task dependencies define the logical relationships between tasks in your project. They ensure that tasks are scheduled in the correct order and that project constraints are automatically enforced.

### Why Use Dependencies?

- **Automatic Schedule Management**: Tasks automatically adjust when their predecessors change
- **Project Logic Enforcement**: Prevents impossible scheduling scenarios
- **Resource Planning**: Helps identify critical path and resource conflicts
- **Risk Management**: Shows impact of delays on dependent tasks

---

## Dependency Types

The system supports four types of task dependencies:

### 1. Finish-to-Start (FS)
**Definition**: Task B cannot start until Task A finishes.

**Example**: 
- Task A: "Pour Foundation" (Jan 1-5)
- Task B: "Build Walls" (Jan 6-15)
- **Logic**: Walls cannot be built until foundation is complete

**Calendar Behavior**: When you move Task A to Jan 3-7, Task B automatically suggests moving to Jan 8-17.

### 2. Start-to-Start (SS)
**Definition**: Task B cannot start until Task A starts.

**Example**:
- Task A: "Site Preparation" (Jan 1-3)
- Task B: "Equipment Setup" (Jan 1-5)
- **Logic**: Equipment setup can begin when site preparation starts

**Calendar Behavior**: When you move Task A to Jan 2-4, Task B suggests moving to Jan 2-6.

### 3. Finish-to-Finish (FF)
**Definition**: Task B cannot finish until Task A finishes.

**Example**:
- Task A: "Install Electrical" (Jan 10-20)
- Task B: "Install Plumbing" (Jan 15-25)
- **Logic**: Both installations must complete together

**Calendar Behavior**: When you extend Task A to Jan 10-22, Task B suggests extending to Jan 17-27.

### 4. Start-to-Finish (SF)
**Definition**: Task B cannot finish until Task A starts.

**Example**:
- Task A: "New System Activation" (Jan 20-25)
- Task B: "Old System Shutdown" (Jan 15-20)
- **Logic**: Old system must shut down when new system starts

**Calendar Behavior**: When you move Task A to Jan 22-27, Task B suggests moving to Jan 15-22.

---

## Lag Days

Lag days add buffer time between dependent tasks.

### Positive Lag (Delay)
- **FS with 2-day lag**: Task B starts 2 days after Task A finishes
- **SS with 1-day lag**: Task B starts 1 day after Task A starts

### Zero Lag (Immediate)
- **FS with 0-day lag**: Task B starts immediately when Task A finishes
- **SS with 0-day lag**: Task B starts when Task A starts

### Examples:
```
Task A: "Concrete Pour" (Jan 1-3)
Task B: "Remove Forms" (FS, 2-day lag)
Result: Task B starts Jan 6 (3 + 2 + 1 = 6)
```

---

## Setting Up Dependencies

### In Task Dialog

1. **Open Task Dialog**: Double-click on any task in calendar or list view
2. **Navigate to Dependencies**: Scroll to "Dependencies" section
3. **Add Dependency**: Click "Add Dependency" button
4. **Select Predecessor**: Choose the task that must complete first
5. **Set Type**: Select dependency type (FS, SS, FF, SF)
6. **Set Lag Days**: Enter buffer time (0 for immediate)
7. **Save**: Click "Save" to apply changes

### Dependency Rules
- ✅ Tasks can have multiple dependencies
- ✅ Dependencies can be chained (A→B→C)
- ❌ Circular dependencies are not allowed
- ❌ Tasks cannot depend on themselves

---

## Calendar Interactions

### Moving Tasks on Calendar

When you drag and drop tasks on the calendar, the system automatically:

1. **Validates Dependencies**: Checks if the new position violates any dependency rules
2. **Shows Warnings**: Displays dependency constraint violations
3. **Suggests Corrections**: Offers alternative dates that respect dependencies
4. **Allows Override**: You can choose to ignore warnings (not recommended)

### Validation Dialogs

#### Project Bounds Violation
**When**: Task is moved outside project timeline
**Dialog**: "Task Outside Project Bounds"
**Options**: 
- **Cancel**: Revert to original position
- **Adjust**: Move task to nearest valid position

#### Dependency Constraint Violation
**When**: Task violates dependency rules
**Dialog**: "Dependency Constraint Violation"
**Shows**:
- List of violated dependencies
- Current vs. suggested dates
- Dependency type and lag information
**Options**:
- **Cancel**: Revert to original position
- **Adjust to Dependencies**: Apply suggested dates

---

## Cascade Movement

### What is Cascade Movement?

When you move a task, all dependent tasks automatically suggest new positions to maintain dependency relationships.

### How It Works

1. **Move Predecessor**: Drag Task A to a new position
2. **System Analysis**: Finds all tasks that depend on Task A
3. **Calculate Impact**: Determines how each dependent task should move
4. **Show Warnings**: Displays which tasks need rescheduling
5. **Suggest Updates**: Offers to automatically adjust dependent tasks

### Example Scenario

```
Original Schedule:
Task A: "Foundation" (Jan 1-5)
Task B: "Walls" (Jan 6-10) [FS dependency on A]
Task C: "Roof" (Jan 8-12) [FS dependency on B]

Move Task A to Jan 3-7:
System suggests:
Task B: Move to Jan 8-12
Task C: Move to Jan 13-17
```

### Cascade Movement Types

#### Forward Cascade (Delay Propagation)
- **Trigger**: Predecessor task is delayed
- **Effect**: All dependent tasks suggest later dates
- **Example**: Foundation delay pushes back entire building schedule

#### Backward Cascade (Schedule Compression)
- **Trigger**: Predecessor task is moved earlier
- **Effect**: Dependent tasks can potentially start earlier
- **Example**: Early foundation completion allows earlier wall construction

---

## Validation System

### Three-Level Validation

#### 1. Project Bounds Validation
**Purpose**: Ensures tasks stay within project timeline
**Checks**:
- Task start date ≥ Project start date
- Task end date ≤ Project end date
**Action**: Shows "Project Bounds" dialog with adjustment options

#### 2. Dependency Constraint Validation
**Purpose**: Ensures dependency rules are respected
**Checks**:
- FS: Successor starts after predecessor ends + lag
- SS: Successor starts after predecessor starts + lag
- FF: Successor ends after predecessor ends + lag
- SF: Successor ends after predecessor starts + lag
**Action**: Shows "Dependency Constraint" dialog with suggested dates

#### 3. Dependent Task Impact Validation
**Purpose**: Warns about tasks that may need rescheduling
**Checks**: All tasks that depend on the moved task
**Action**: Shows warnings in validation results

### Validation Messages

#### Error Messages (Blocking)
- "Task starts before project begins"
- "Task violates FS dependency with [Task Name]"
- "Predecessor task with ID X not found"

#### Warning Messages (Informational)
- "Task [Name] may need to be rescheduled due to changes in [Predecessor]"
- "Expected start: [Date], current: [Date]"

---

## Best Practices

### 1. Plan Dependencies Early
- Set up dependencies during project planning phase
- Review and update dependencies as project evolves
- Document dependency rationale for team understanding

### 2. Use Appropriate Dependency Types
- **FS**: Most common, for sequential work
- **SS**: For parallel work that starts together
- **FF**: For work that must complete together
- **SF**: For handoff scenarios

### 3. Set Realistic Lag Days
- Consider actual work requirements
- Account for material delivery times
- Include buffer for unexpected delays

### 4. Monitor Cascade Effects
- Always review suggested changes to dependent tasks
- Consider impact on resources and deadlines
- Communicate schedule changes to team members

### 5. Regular Dependency Review
- Weekly dependency status review
- Update dependencies when work methods change
- Remove obsolete dependencies

---

## Troubleshooting

### Common Issues

#### "Predecessor task not found"
**Cause**: Referenced task was deleted or ID mismatch
**Solution**: 
1. Check if predecessor task exists
2. Recreate dependency with correct task
3. Verify task IDs are consistent

#### "Circular dependency detected"
**Cause**: Task A depends on Task B, which depends on Task A
**Solution**:
1. Review dependency chain
2. Remove circular reference
3. Redesign task sequence

#### "Task violates dependency constraint"
**Cause**: Manual date change conflicts with dependency rules
**Solution**:
1. Review dependency dialog
2. Accept suggested dates
3. Or modify dependency rules if appropriate

#### "Cascade movement not working"
**Cause**: Dependencies not properly configured
**Solution**:
1. Verify dependency types are correct
2. Check lag day settings
3. Ensure predecessor tasks have valid dates

### Getting Help

#### Validation Dialog Help
- Read error messages carefully
- Use "Adjust" buttons for automatic corrections
- Review suggested dates before accepting

#### Dependency Management
- Use task list view to see all dependencies
- Check dependency types and lag days
- Verify task dates are properly set

#### Calendar Issues
- Refresh calendar view if tasks don't update
- Check project bounds are properly set
- Verify user has edit permissions

---

## Summary

The task dependency system is a powerful tool for maintaining project schedule integrity. By understanding dependency types, setting appropriate relationships, and using the validation system effectively, you can:

- ✅ **Automate schedule management**
- ✅ **Prevent scheduling conflicts**
- ✅ **Maintain project logic**
- ✅ **Improve project predictability**
- ✅ **Reduce manual schedule updates**

Remember: Dependencies are not just constraints—they're tools for better project management. Use them wisely to create robust, maintainable project schedules.

---

*For technical support or advanced configuration questions, contact your system administrator.*
