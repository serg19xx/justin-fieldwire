# Task Dependencies - Quick Reference Card

## Dependency Types

| Type | Name | Rule | Example |
|------|------|------|---------|
| **FS** | Finish-to-Start | B starts after A finishes | Foundation → Walls |
| **SS** | Start-to-Start | B starts when A starts | Site Prep → Equipment Setup |
| **FF** | Finish-to-Finish | B finishes when A finishes | Electrical ↔ Plumbing |
| **SF** | Start-to-Finish | B finishes when A starts | New System → Old System Shutdown |

## Lag Days

- **0 days**: Immediate (default)
- **1+ days**: Buffer time between tasks
- **Example**: FS with 2-day lag = Task B starts 2 days after Task A finishes

## Calendar Behavior

### Moving Tasks
1. **Drag task** to new position
2. **System validates** dependencies automatically
3. **Shows dialog** if constraints violated
4. **Choose**: Cancel (revert) or Adjust (apply suggested dates)

### Cascade Movement
- **Move predecessor** → **Dependent tasks suggest new dates**
- **Review warnings** → **Accept or modify suggestions**

## Validation Dialogs

### Project Bounds Violation
- **When**: Task outside project timeline
- **Action**: Adjust to nearest valid position

### Dependency Constraint Violation
- **When**: Task violates dependency rules
- **Shows**: Violated dependencies + suggested dates
- **Action**: Apply suggested dates or modify dependencies

## Quick Setup

1. **Open task dialog** (double-click task)
2. **Add dependency** → Select predecessor
3. **Set type** (FS/SS/FF/SF)
4. **Set lag days** (0 for immediate)
5. **Save** → Dependencies active

## Common Scenarios

### Sequential Work (FS)
```
Foundation (Jan 1-5) → Walls (Jan 6-10) → Roof (Jan 11-15)
```

### Parallel Work (SS)
```
Site Prep (Jan 1-3) → Equipment Setup (Jan 1-5)
```

### Coordinated Finish (FF)
```
Electrical (Jan 10-20) ↔ Plumbing (Jan 15-25)
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Predecessor not found" | Check task exists, recreate dependency |
| "Circular dependency" | Remove circular reference |
| "Constraint violated" | Use suggested dates or modify dependency |
| "Cascade not working" | Verify dependency types and dates |

## Best Practices

- ✅ **Plan dependencies early** in project
- ✅ **Use FS for sequential work** (most common)
- ✅ **Set realistic lag days** for buffers
- ✅ **Review cascade effects** before accepting
- ✅ **Update dependencies** when work methods change

---

*For detailed information, see: TASK_DEPENDENCIES_USER_GUIDE.md*
