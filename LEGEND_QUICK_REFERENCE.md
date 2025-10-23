# Legend Quick Reference Card

## Task Types
| Icon | Meaning |
|------|---------|
| 📝 | Regular Task |
| 🎯 | Milestone |

## Status Colors
| Color | Status |
|-------|--------|
| 🔵 Blue | Planned |
| 🟢 Green | In Progress |
| ⚫ Gray | Done |
| 🔴 Red | Blocked |
| 🟡 Yellow | Delayed |

## Dependencies
| Icon | Type | Meaning |
|------|------|---------|
| 🔗 | FS | Finish-to-Start |
| ⚡ | SS | Start-to-Start |
| 🏁 | FF | Finish-to-Finish |
| 🔄 | SF | Start-to-Finish |
| ⏱️ | Lag | Buffer time |
| 📋 | Deps | Number of dependencies |

## Examples
```
📝 Design Website          (Regular task, no dependencies)
📝 Code Frontend 📋3       (Regular task, 3 dependencies)
🎯 Project Launch 📋2      (Milestone, 2 dependencies)
📝 Testing 🔗⚡⏱️📋4        (Complex task with multiple dependency types)
```

## Quick Tips
- **High 📋 numbers** = Complex tasks, may be critical path
- **⏱️ indicators** = Tasks with buffer time
- **Red tasks** = Need immediate attention
- **Yellow tasks** = Behind schedule
- **🎯 milestones** = Key project deliverables
