# Task Dependencies Documentation

This directory contains comprehensive documentation for the Fieldwire task dependency system.

## 📚 Documentation Files

### For End Users
- **[TASK_DEPENDENCIES_USER_GUIDE.md](./TASK_DEPENDENCIES_USER_GUIDE.md)** - Complete user guide with examples and best practices
- **[DEPENDENCY_QUICK_REFERENCE.md](./DEPENDENCY_QUICK_REFERENCE.md)** - Quick reference card for daily use
- **[DEPENDENCY_DIAGRAMS.md](./DEPENDENCY_DIAGRAMS.md)** - Visual diagrams and examples
- **[DEPENDENCY_INDICATORS_GUIDE.md](./DEPENDENCY_INDICATORS_GUIDE.md)** - Visual indicators in calendar view
- **[MILESTONE_TASKS_GUIDE.md](./MILESTONE_TASKS_GUIDE.md)** - Milestone tasks and point-in-time events

### For Administrators
- **[DEPENDENCY_ADMIN_GUIDE.md](./DEPENDENCY_ADMIN_GUIDE.md)** - Technical implementation and troubleshooting guide

## 🚀 Quick Start

### New Users
1. **Start with**: [DEPENDENCY_QUICK_REFERENCE.md](./DEPENDENCY_QUICK_REFERENCE.md)
2. **Learn more**: [TASK_DEPENDENCIES_USER_GUIDE.md](./TASK_DEPENDENCIES_USER_GUIDE.md)
3. **Visualize**: [DEPENDENCY_DIAGRAMS.md](./DEPENDENCY_DIAGRAMS.md)

### Administrators
1. **Technical details**: [DEPENDENCY_ADMIN_GUIDE.md](./DEPENDENCY_ADMIN_GUIDE.md)
2. **User training**: [TASK_DEPENDENCIES_USER_GUIDE.md](./TASK_DEPENDENCIES_USER_GUIDE.md)

## 🎯 Key Concepts

### Dependency Types
- **FS (Finish-to-Start)**: Most common, sequential work
- **SS (Start-to-Start)**: Parallel work coordination  
- **FF (Finish-to-Finish)**: Coordinated completion
- **SF (Start-to-Finish)**: Handoff scenarios

### Key Features
- ✅ **Automatic validation** on calendar interactions
- ✅ **Cascade movement** of dependent tasks
- ✅ **Lag days** for buffer time
- ✅ **Project bounds** enforcement
- ✅ **Visual feedback** with validation dialogs
- ✅ **Dependency indicators** in calendar task titles
- ✅ **Milestone tasks** with type-specific icons and colors

## 📋 Common Use Cases

### Construction Projects
```
Foundation (FS) → Walls (FS) → Roof (FS) → Finishing
```

### Software Development
```
Design (FS) → Development (SS) → Testing (FF) → Deployment
```

### Event Planning
```
Venue Booking (FS) → Catering (SS) → Setup (FF) → Event
```

## 🔧 Troubleshooting

### Quick Fixes
- **"Predecessor not found"**: Check if task exists, recreate dependency
- **"Circular dependency"**: Remove circular reference
- **"Constraint violated"**: Use suggested dates or modify dependency
- **"Cascade not working"**: Verify dependency types and dates

### Getting Help
1. **Check**: [DEPENDENCY_QUICK_REFERENCE.md](./DEPENDENCY_QUICK_REFERENCE.md) troubleshooting section
2. **Read**: [TASK_DEPENDENCIES_USER_GUIDE.md](./TASK_DEPENDENCIES_USER_GUIDE.md) troubleshooting chapter
3. **Contact**: System administrator for technical issues

## 📊 System Benefits

### For Project Managers
- **Automatic schedule management**
- **Risk identification and mitigation**
- **Resource conflict prevention**
- **Project logic enforcement**

### For Team Members
- **Clear task relationships**
- **Automatic schedule updates**
- **Reduced manual coordination**
- **Improved project predictability**

## 🎓 Training Materials

### For New Users
1. **Read**: Quick reference card
2. **Practice**: Set up simple FS dependencies
3. **Experiment**: Try different dependency types
4. **Learn**: Advanced features from user guide

### For Power Users
1. **Master**: All dependency types
2. **Optimize**: Use lag days effectively
3. **Manage**: Complex dependency chains
4. **Troubleshoot**: Common issues independently

## 📈 Best Practices

### Planning Phase
- Set up dependencies early in project
- Use appropriate dependency types
- Set realistic lag days
- Document dependency rationale

### Execution Phase
- Monitor cascade effects
- Review validation warnings
- Update dependencies when needed
- Communicate schedule changes

### Maintenance
- Regular dependency review
- Remove obsolete dependencies
- Update when work methods change
- Train new team members

## 🔄 System Updates

### Recent Improvements
- Enhanced validation dialogs
- Improved cascade movement
- Better error messages
- Performance optimizations

### Planned Features
- Dependency templates
- Bulk operations
- Advanced scheduling
- Enhanced visualization

---

## 📞 Support

### Documentation Issues
- **Missing information**: Contact system administrator
- **Unclear explanations**: Request clarification
- **Outdated content**: Report for update

### Technical Issues
- **System errors**: Check admin guide troubleshooting
- **Performance problems**: Contact technical support
- **Feature requests**: Submit through proper channels

---

*This documentation is maintained by the Fieldwire development team. Last updated: [Current Date]*
