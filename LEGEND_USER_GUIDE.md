# Project Legend User Guide

## Overview

The project legend system provides visual indicators to help you understand task statuses, dependencies, and milestones at a glance. This guide explains all symbols and their meanings.

## Task Status Legend

### Color-Coded Status Indicators

| Color | Status | Description |
|-------|--------|-------------|
| 🔵 **Blue** | Planned | Task is scheduled but not started |
| 🟢 **Green** | In Progress | Task is currently being worked on |
| ⚫ **Gray** | Done | Task has been completed |
| 🔴 **Red** | Blocked | Task cannot proceed due to obstacles |
| 🟡 **Yellow** | Delayed | Task is behind schedule |

### Task Type Icons

| Icon | Type | Description |
|------|------|-------------|
| 📝 | Regular Task | Standard project task with duration |
| 🎯 | Milestone | Key project deliverable or checkpoint |

## Dependency System

### Dependency Types

The system supports four types of task dependencies:

| Icon | Type | Full Name | Description |
|------|------|-----------|-------------|
| 🔗 | FS | Finish-to-Start | Task B cannot start until Task A is finished |
| ⚡ | SS | Start-to-Start | Task B cannot start until Task A starts |
| 🏁 | FF | Finish-to-Finish | Task B cannot finish until Task A finishes |
| 🔄 | SF | Start-to-Finish | Task B cannot finish until Task A starts |

### Additional Dependency Indicators

| Icon | Meaning | Description |
|------|---------|-------------|
| ⏱️ | Lag | Buffer time between dependent tasks |
| 📋 | Deps | Number of dependencies a task has |

## How to Read Task Bars

### Basic Task Bar
```
📝 Design Website
```
- **📝** = Regular task
- **Blue color** = Planned status
- **No dependency indicators** = No dependencies

### Task with Dependencies
```
📝 Code Frontend 📋3
```
- **📝** = Regular task
- **Blue color** = Planned status
- **📋3** = Has 3 dependencies

### Milestone with Dependencies
```
🎯 Project Launch 📋2
```
- **🎯** = Milestone
- **Purple color** = Milestone
- **📋2** = Has 2 dependencies

### Complex Task with Multiple Indicators
```
📝 System Testing 🔗⚡⏱️📋4
```
- **📝** = Regular task
- **🔗** = Finish-to-Start dependency
- **⚡** = Start-to-Start dependency
- **⏱️** = Has lag time
- **📋4** = Total of 4 dependencies

## Calendar View Legend

### Status Legend
```
Tasks: [Blue] Planned [Green] In Progress [Gray] Done [Red] Blocked [Yellow] Delayed
```

### Dependencies Legend
```
Dependencies: 🔗 FS ⚡ SS 🏁 FF 🔄 SF ⏱️ Lag 📋 Deps
```

### Milestones Legend
```
Milestones: 🔍 Inspection 🏗️ Visit 🎯 Launch
```

## Gantt Chart View

### Task Bars
- **Horizontal bars** represent task duration
- **Colors** indicate task status
- **Icons** show task type and dependencies
- **Numbers** show dependency count

### Dependency Arrows
- **Solid lines** connect dependent tasks
- **Arrow direction** shows dependency flow
- **Labels** indicate dependency type and lag

## Best Practices

### Reading Dependencies
1. **Look for 📋 numbers** - Higher numbers indicate more complex tasks
2. **Check dependency types** - FS dependencies are most common
3. **Watch for ⏱️ lag indicators** - Tasks with buffer time need careful scheduling
4. **Identify critical tasks** - Tasks with many dependencies are often critical path items

### Managing Complex Projects
1. **Start with milestones** - Use 🎯 to identify key deliverables
2. **Track dependencies** - Monitor 📋 numbers to avoid bottlenecks
3. **Plan for lag time** - Account for ⏱️ indicators in scheduling
4. **Color-code priorities** - Use status colors to prioritize work

### Troubleshooting
- **Red tasks** need immediate attention
- **Yellow tasks** are behind schedule
- **High 📋 numbers** may indicate scheduling risks
- **Missing dependencies** show as tasks without 📋 indicators

## Legend Controls

### Toggle Dependency Indicators
- **Show Deps** button - Displays all dependency indicators
- **Hide Deps** button - Shows only basic task information
- **Toggle as needed** - Switch between detailed and clean views

### View Modes
- **Calendar** - Shows tasks as events with full legend
- **Gantt** - Shows tasks as bars with dependency arrows
- **List** - Shows tasks in table format with status indicators

## Quick Reference

### Most Common Indicators
- **📝** = Regular task
- **🎯** = Milestone
- **📋3** = 3 dependencies
- **🔗** = Finish-to-Start dependency
- **⏱️** = Has lag time

### Status Colors
- **Blue** = Planned
- **Green** = In Progress
- **Gray** = Done
- **Red** = Blocked
- **Yellow** = Delayed

### Dependency Types
- **🔗 FS** = Most common (finish before start)
- **⚡ SS** = Start together
- **🏁 FF** = Finish together
- **🔄 SF** = Start before finish

## Support

If you need help understanding any legend elements:
1. **Hover over indicators** for tooltips
2. **Check the legend** at the top of each view
3. **Refer to this guide** for detailed explanations
4. **Contact support** for additional assistance

---

*This guide covers all legend elements in the project management system. Keep it handy for quick reference while working with project tasks and dependencies.*
