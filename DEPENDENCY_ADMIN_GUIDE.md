# Task Dependencies - Administrator Guide

## System Overview

The task dependency system is implemented across multiple components:

### Core Components
- **`src/utils/task-validation.ts`**: Main validation logic
- **`src/utils/dependency-validator.ts`**: Dependency constraint checking
- **`src/components/TaskDialog.vue`**: Dependency setup interface
- **`src/components/ProjectCalendar.vue`**: Calendar interaction handling
- **`src/components/DependencyValidationDialog.vue`**: Validation dialog UI

## Technical Implementation

### Validation Flow
1. **Project Bounds Check**: `validateProjectBounds()`
2. **Dependency Validation**: `validateDependencies()`
3. **Dependent Task Impact**: `validateDependentTasks()`
4. **Constraint Checking**: `checkDependencyConstraints()`

### Data Structures

#### Task Dependencies
```typescript
interface Dependency {
  predecessor_id: number
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lag_days: number
}
```

#### Validation Results
```typescript
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
```

## Configuration

### Dependency Types
- **FS (Finish-to-Start)**: Most common, sequential work
- **SS (Start-to-Start)**: Parallel work coordination
- **FF (Finish-to-Finish)**: Coordinated completion
- **SF (Start-to-Finish)**: Handoff scenarios

### Validation Rules
- **Project Bounds**: Tasks must stay within project timeline
- **Dependency Constraints**: Respect predecessor relationships
- **Lag Days**: Buffer time between dependent tasks
- **Circular Dependencies**: Prevented by validation logic

## User Interface Components

### TaskDialog Dependencies Section
- Add/remove dependencies
- Set dependency types
- Configure lag days
- Visual dependency preview

### Calendar Validation Dialogs
- **SimpleBoundsDialog**: Project bounds violations
- **DependencyValidationDialog**: Constraint violations
- **Warning Messages**: Dependent task impacts

### Calendar Interactions
- **Drag & Drop**: Automatic validation
- **Resize**: Constraint checking
- **Cascade Movement**: Dependent task suggestions

## Troubleshooting

### Common Issues

#### Validation Errors
```typescript
// Check dependency data structure
if (!taskData.dependencies || taskData.dependencies.length === 0) {
  return { isValid: true, errors: [], warnings: [] }
}
```

#### ID Mismatch Issues
```typescript
// Handle both string and number IDs
const predecessorTask = existingTasks.find(
  (t) =>
    t.id === String(dependency.predecessor_id) || 
    Number(t.id) === dependency.predecessor_id
)
```

#### Date Format Issues
```typescript
// Support both naming conventions
const startDate = taskData.startPlanned || taskData.start_planned
const endDate = taskData.endPlanned || taskData.end_planned
```

### Debug Information

#### Console Logging
The system includes extensive console logging for debugging:
- `🔍` Dependency validation checks
- `📅` Calendar interaction events
- `⚠️` Warning messages
- `❌` Error conditions
- `✅` Success confirmations

#### Validation Debugging
```typescript
console.log('🔍 Project bounds validation:', {
  taskStart: taskStart.toISOString().split('T')[0],
  taskEnd: taskEnd.toISOString().split('T')[0],
  projectStart: projectStart.toISOString().split('T')[0],
  projectEnd: projectEnd.toISOString().split('T')[0]
})
```

## Performance Considerations

### Validation Optimization
- **Early Returns**: Skip validation if no dependencies
- **Efficient Lookups**: Use `find()` for predecessor tasks
- **Batch Processing**: Validate multiple dependencies together

### Calendar Performance
- **Event Batching**: Group calendar updates
- **Debounced Validation**: Prevent excessive validation calls
- **Lazy Loading**: Load dependencies on demand

## Security Considerations

### Data Validation
- **Input Sanitization**: Validate dependency data
- **Permission Checks**: Verify user can modify dependencies
- **Circular Dependency Prevention**: Block invalid relationships

### API Security
- **Rate Limiting**: Prevent excessive validation requests
- **Data Integrity**: Ensure consistent dependency state
- **Audit Logging**: Track dependency changes

## Monitoring and Maintenance

### Health Checks
- **Dependency Integrity**: Verify all references are valid
- **Performance Metrics**: Monitor validation response times
- **Error Rates**: Track validation failure rates

### Regular Maintenance
- **Cleanup Orphaned Dependencies**: Remove references to deleted tasks
- **Update Dependency Logic**: Enhance validation rules as needed
- **Performance Optimization**: Monitor and improve validation speed

## User Training

### Key Concepts to Emphasize
1. **Dependency Types**: When to use each type
2. **Lag Days**: Purpose and appropriate values
3. **Cascade Movement**: Understanding automatic adjustments
4. **Validation Dialogs**: How to respond to warnings

### Common User Mistakes
- **Over-constraining**: Too many dependencies
- **Wrong Types**: Using FS when SS is appropriate
- **Ignoring Warnings**: Not reviewing cascade effects
- **Circular Dependencies**: Creating impossible schedules

## Future Enhancements

### Planned Features
- **Dependency Templates**: Pre-configured dependency sets
- **Bulk Operations**: Mass dependency updates
- **Advanced Scheduling**: Resource-based dependencies
- **Visualization**: Gantt chart with dependencies

### Technical Improvements
- **Real-time Validation**: Instant feedback during editing
- **Conflict Resolution**: Automated dependency conflict handling
- **Performance Optimization**: Faster validation algorithms
- **Mobile Support**: Touch-friendly dependency management

---

*This guide is for system administrators and developers. For end-user documentation, see TASK_DEPENDENCIES_USER_GUIDE.md*
