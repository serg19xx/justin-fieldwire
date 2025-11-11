# FieldWire - Project Manager User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Logging In](#logging-in)
3. [Main Menu](#main-menu)
4. [Dashboard](#dashboard)
5. [My Projects](#my-projects)
6. [Working with a Project](#working-with-a-project)
7. [Task Management](#task-management)
8. [Milestone Management](#milestone-management)
9. [Project Team Management](#project-team-management)
10. [Reports](#reports)
11. [Account Settings](#account-settings)

---

## Introduction

FieldWire is a construction project management system designed for construction project support and management. This manual is intended for users with the **Project Manager** role.

### Project Manager Role

The Project Manager has access to the following functions:
- Management of assigned projects
- Creating and editing tasks
- Creating and managing milestones
- Project team management
- Viewing project reports
- Uploading and managing project files

---

## Logging In

### Authentication

1. Open the FieldWire application in your browser
2. On the login page, enter:
   - **Email** - your email address
   - **Password** - your password
3. Click the **"Sign In"** button

### Password Reset

If you forgot your password:
1. On the login page, click **"Forgot password?"**
2. Enter your email
3. Follow the instructions in the email to reset your password

### Password Change

If you have a temporary password:
1. After logging in, you will be redirected to the password change page
2. Enter your current password
3. Enter a new password (must meet security requirements)
4. Confirm the new password
5. Click **"Change Password"**

---

## Main Menu

The main menu is located at the top of the screen and contains the following items:

### Available for Project Manager:

1. **Dashboard** - Main dashboard with overview of your projects
2. **My Projects** - List of your projects
3. **Team** - Project team management
4. **Reports** - View project reports
5. **Account** - Account settings

---

## Dashboard

### Overview

The Project Manager Dashboard provides an overview of your projects and tasks:
- **Active Projects** - Number of active projects
- **Tasks This Week** - Tasks for this week
- **Team Members** - Number of team members

### Recent Projects

The Dashboard displays a list of recent projects with completion progress information.

---

## My Projects

### Project List

Access to your project list through the **My Projects** menu.

#### Project List Functions:

1. **Project Search**
   - Use the search field to filter projects by name
   - Search works in real-time

2. **Project Filtering**
   - By status (Active, Completed, On Hold, Draft)
   - By priority (High, Medium, Low)

3. **Project Sorting**
   - By name (A-Z, Z-A)
   - By creation date
   - By status
   - By progress

4. **Project Statistics**
   - Total number of projects
   - Active projects
   - Completed projects
   - Projects on hold

### Creating a New Project

1. On the project list page, click the **"New Project"** button
2. Fill in the project creation form:
   - **Project Name** * (required) - Project name
   - **Address** - Project address
   - **Description** - Project description
   - **Priority** - Priority (High, Medium, Low)
   - **Status** - Status (Draft, Active, On Hold, Completed)
   - **Start Date** - Project start date
   - **End Date** - Project end date
   - **Project Manager** - Automatically set to you
3. Click **"Create Project"**

**Note:** Project Manager cannot assign other project managers. Only administrators can do this.

### Opening a Project

1. Click on a project in the list
2. The project details page opens

---

## Working with a Project

### Project Structure

When opening a project, you see the following sections:

1. **Plans** - Plans and drawings
2. **Tasks** - Project tasks
3. **Photos** - Project photos
4. **Team** - Project team
5. **Settings** - Project settings

### Plans Section

The Plans section is designed for managing project files: drawings, plans, specifications, and other documents.

#### File Management

1. **Uploading Files**
   - Click the **"Upload"** button or drag files to the upload area
   - Select files to upload
   - Select destination folder (or create a new one)
   - Click **"Upload"**
   - Track upload progress

2. **Creating Folders**
   - Click the **"New Folder"** button
   - Enter folder name
   - Select parent folder (optional)
   - Click **"Create"**

3. **Viewing Files**
   - **Icons View** - View as icons (default)
   - **Details View** - View as list with details

4. **File Operations**
   - **Preview** - View file (double-click or Preview button)
   - **Download** - Download file
   - **Rename** - Rename file/folder
   - **Move** - Move to another folder
   - **Copy** - Copy file/folder
   - **Cut** - Cut for moving
   - **Paste** - Paste copied/cut items
   - **Delete** - Delete file/folder

5. **Selecting Multiple Files**
   - Use checkboxes to select multiple files
   - Apply operations to selected files

#### File Organization

It is recommended to organize files by categories:
- **Plans** - Drawings and plans
- **Specifications** - Specifications
- **Documents** - Documents
- **Photos** - Photos
- **Reports** - Reports

### Tasks Section

The Tasks section provides various views for working with project tasks.

#### Task Views

1. **Calendar View** - Calendar view
   - Display tasks on calendar
   - Drag tasks to change dates
   - Change task duration by dragging edges

2. **Gantt View** - Gantt chart
   - Visualize dependencies between tasks
   - Display project timeline
   - Manage dependencies by dragging

3. **List View** - Task list
   - Table view of all tasks
   - Sorting and filtering
   - Quick access to editing

#### Creating a Task

1. **Via "New Task" Button**
   - Click the **"New Task"** button in the Tasks section
   - Fill in the task creation form

2. **Via Calendar**
   - Click on a date in the calendar view
   - Task creation dialog opens with pre-filled date

3. **Filling Task Form:**
   - **Task Name** * - Task name (required)
   - **WBS Path** - Work breakdown structure path (e.g., "1.1.1")
   - **Start Date** * - Start date (required)
   - **End Date** * - End date (required)
   - **Duration** - Duration in days (automatically calculated)
   - **Status** - Task status:
     - Planned - Planned
     - In Progress - In progress
     - Done - Completed
     - Blocked - Blocked
     - Delayed - Delayed
   - **Progress** - Completion progress (0-100%)
   - **Task Lead** - Task responsible (select from available people list)
   - **Team Members** - Team members to execute the task
   - **Dependencies** - Dependencies on other tasks
   - **Resources** - Resources required for the task
   - **Notes** - Notes and task description

4. Click **"Create Task"**

#### Editing a Task

1. **Opening Task for Editing:**
   - Click on a task in the calendar, Gantt chart, or list
   - Task editing dialog opens

2. **Task Edit Panel:**
   - Full-screen panel for detailed editing
   - All task fields available for editing
   - Sections:
     - **Basic Info** - Basic information
     - **Dependencies** - Dependencies
     - **Team & Resources** - Team and resources
     - **Notes** - Notes

3. **Changing Fields:**
   - Change necessary fields
   - Click **"Save Changes"**

#### Quick Editing via Calendar

- **Changing Date:** Drag task to new date
- **Changing Duration:** Drag task edge to change duration
- **Changing Status:** Use task context menu

#### Deleting a Task

1. Open task for editing
2. Click the **"Delete"** button
3. Confirm deletion

**Warning:** Deleting a task also deletes all dependencies associated with it.

#### Duplicating a Task

1. Open task for editing
2. Click the **"Duplicate"** button
3. Task will be copied with new name and dates

#### Task Dependencies

Dependencies define the order of task execution.

##### Adding a Dependency

1. Open task for editing
2. Go to the **Dependencies** section
3. Click **"Add Dependency"**
4. Select predecessor task from the list
5. Select dependency type:
   - **FS (Finish-to-Start)** - Current task starts after predecessor finishes
   - **SS (Start-to-Start)** - Both tasks start simultaneously
   - **FF (Finish-to-Finish)** - Both tasks finish simultaneously
   - **SF (Start-to-Finish)** - Current task finishes when predecessor starts
6. Specify lag (lag days) - number of days delay between tasks
7. Click **"Add"**

##### Removing a Dependency

1. Open task for editing
2. Go to the **Dependencies** section
3. Find dependency in the list
4. Click the **"Remove"** button next to the dependency

##### Dependency Validation

The system automatically checks dependencies for:
- Circular dependencies
- Violation of project time constraints
- Conflicts with other dependencies

If problems are detected, the system will show a warning and suggest solutions.

#### Assigning Team to Task

1. Open task for editing
2. Go to the **Team & Resources** section
3. **Select Task Lead:**
   - Select task responsible from available people list
   - Task Lead is automatically added to Team Members list
4. **Add Team Members:**
   - Click **"Add Team Member"**
   - Select team member from the list
   - Repeat to add multiple team members
5. Click **"Save Changes"**

#### Exporting Tasks to iCal

1. Open the **Tasks** section
2. Click the **"Export to iCal"** or **"Export Calendar"** button
3. File will be downloaded in .ics format
4. Import the file into your calendar (Google Calendar, Outlook, Apple Calendar, etc.)

---

## Milestone Management

Milestones are key project events (inspections, meetings, deliveries, etc.).

### Creating a Milestone

1. **Via "New Milestone" Button**
   - Click the **"New Milestone"** button in the Tasks section
   - Fill in the milestone creation form

2. **Via Calendar**
   - Click on a date in the calendar view
   - Select milestone creation option

3. **Filling Milestone Form:**
   - **Milestone Name** * - Milestone name (required)
   - **Milestone Type** - Milestone type:
     - 🔍 Inspection - Inspection
     - 🏗️ Site Visit - Site visit
     - 👥 Meeting - Meeting
     - 📋 Review - Review
     - 📦 Delivery - Delivery
     - ✅ Approval - Approval
     - 🎯 Other - Other
   - **Date** * - Milestone date (required)
   - **Status** - Status:
     - Planned - Planned
     - In Progress - In progress
     - Done - Completed
     - Blocked - Blocked
     - Delayed - Delayed
   - **Project Lead** * - Responsible (required, automatically set to you if you are PM)
   - **Invited People** - Invited people (external participants who are not project team members)
   - **Notes** - Notes and description

4. Click **"Create Milestone"**

### Adding Invited People to Milestone

Invited people are external participants who are not project team members but should attend the milestone.

1. In the milestone creation/editing form, find the **Invited People** section
2. Click the **"+ Add Invited Person"** button
3. Fill in the form:
   - **Name** * - Name (required)
   - **Email** - Email address
   - **Company** - Company
   - **Phone** - Phone (format: +1 (XXX) XXX-XXXX)
   - **Notes** - Additional information
4. Click **"Add Person"**
5. Repeat to add multiple invited people

### Editing a Milestone

1. Click on a milestone in the calendar
2. Milestone editing dialog opens
3. Change necessary fields
4. Click **"Save Changes"**

### Deleting a Milestone

1. Open milestone for editing
2. Click the **"Delete"** button
3. Confirm deletion

### Removing Invited Person

1. Open milestone for editing
2. In the **Invited People** section, find the invited person
3. Click the **"Remove"** button (X icon)
4. Invited person will be removed from the list

---

## Project Team Management

### Team Section

The Team section displays all project team members and their task assignments.

#### Viewing Team

The Team section displays:
- List of all project team members
- Each member's role in the project
- Assigned tasks for each member
- Task completion status

#### Adding Team Member

1. Click the **"Add Team Member"** button
2. Add team member dialog opens
3. Select user from available list:
   - Use search for quick search
   - Filter by role or status
4. Select role in project:
   - **Project Manager** - Project manager
   - **Task Lead** - Task responsible
   - **Member** - Team member
   - **Invited** - Invited (for external participants)
5. Click **"Add"**

#### Viewing Team Member Details

1. Click on a team member card
2. Dialog opens with detailed information:
   - Personal information
   - Contact details
   - Role in project
   - Assigned tasks
   - Activity history in project

#### Changing Team Member Role

1. Open team member details
2. Click the **"Edit Role"** button
3. Select new role from the list
4. Click **"Save"**

#### Deleting Team Member

1. Open team member details
2. Click the **"Remove from Project"** button
3. Confirm deletion

**Warning:** Deleting a team member does not remove them from assigned tasks. You must manually remove them from tasks.

#### Assigning Worker to Task

1. In the Team section, find the task in the team member's task list
2. Click the **"Assign Worker"** button next to the task
3. Select worker from available list
4. Click **"Assign"**

#### Removing Worker from Task

1. In the Team section, find the task
2. Find the assigned worker in the list
3. Click the **"Remove"** button next to the worker
4. Confirm removal

---

## Reports

### Access to Reports

The **Reports** menu provides access to various project reports.

### Report Types

1. **Project Reports** - Project reports
   - Overall project progress
   - Task statistics
   - Timeline analysis

2. **Task Reports** - Task reports
   - Task list with filtering
   - Tasks by status
   - Tasks by responsible

3. **Team Reports** - Team reports
   - Team workload
   - Task completion by team members
   - Statistics by roles

### Exporting Reports

Most reports can be exported in various formats:
- PDF
- Excel
- CSV

---

## Account Settings

### Access to Settings

The **Account** menu provides access to your account settings.

### Settings Sections

#### 1. Basic Information

- **Avatar** - Upload and change avatar
  - Click on current avatar
  - Select new image
  - Crop image if necessary
  - Click **"Save"**

- **Full Photo** - Upload full photo
  - Click **"Upload Full Photo"**
  - Select photo
  - Crop if necessary
  - Click **"Save"**

- **Gender** - Gender
- **Age/Birth Date** - Age/Birth date
- **Specialty/Job Title** - Specialty/Job title

#### 2. Contact Information

- **Email** - Email address
- **Phone** - Phone number
- **Address** - Address

#### 3. Security

- **Change Password** - Change password
  1. Enter current password
  2. Enter new password
  3. Confirm new password
  4. Click **"Change Password"**

- **Two-Factor Authentication** - Two-factor authentication
  - Enable/disable 2FA
  - Configure authentication methods

#### 4. Preferences

- **Language** - Interface language
- **Timezone** - Timezone
- **Notifications** - Notification settings
  - Email notifications
  - SMS notifications
  - Push notifications

---

## Working with Project (Detailed Overview)

### Settings Section

#### Basic Project Settings

In the Settings section, you can change:

- **Project Name** - Project name
- **Address** - Project address
- **Description** - Project description
- **Priority** - Priority (High, Medium, Low)
- **Status** - Status (Draft, Active, On Hold, Completed)
- **Start Date** - Project start date
- **End Date** - Project end date

**Note:** Project Manager cannot change the project manager. Only administrators can do this.

#### Saving Changes

1. Change necessary fields
2. Click the **"Save Changes"** button
3. Changes will be saved

#### Project Date Validation

The system automatically checks:
- Project start date must be earlier than end date
- Project tasks must be within project dates
- If project boundaries are violated, the system will suggest extending project dates

---

## Tips and Recommendations

### Task Management

- Always assign a responsible person (Task Lead) for each task
- Use dependencies for correct task execution sequence
- Regularly update task statuses and progress
- Use notes for important task information

### Milestone Management

- Create milestones for all key project events
- Add invited people in advance
- Update milestone statuses after they occur
- Use notes to record milestone results

### Team Management

- Clearly define team member roles
- Regularly check task assignments
- Remove inactive team members
- Use the Team section to monitor team workload

### File Organization

- Create folder structure to organize files
- Use clear names for files and folders
- Regularly check and delete outdated files
- Use Details View to view file metadata

### Project Timeframes

- Always set realistic project start and end dates
- Regularly check task compliance with project timeframes
- Use system validation to check dates
- Extend project dates when necessary

---

## Frequently Asked Questions

### How to create a task with dependency?

1. Create the predecessor task
2. Create the current task
3. Open the current task for editing
4. Go to the Dependencies section
5. Add dependency on the predecessor task

### How to add external participant to milestone?

1. Open milestone for editing
2. In the Invited People section, click "+ Add Invited Person"
3. Fill in the form with invited person information
4. Click "Add Person"

### How to export tasks to calendar?

1. Open the project Tasks section
2. Click the "Export to iCal" button
3. .ics file will be downloaded
4. Import the file into your calendar

### How to organize project files?

1. Create folders by categories (Plans, Specifications, Documents, etc.)
2. Upload files to corresponding folders
3. Use clear names for files
4. Regularly check and clean folder structure

### How to assign team to task?

1. Open task for editing
2. Go to the Team & Resources section
3. Select Task Lead from the list
4. Add Team Members via "Add Team Member" button
5. Click "Save Changes"

---

## Support

If you have questions or issues:
1. Check this manual
2. Contact the system administrator
3. Contact technical support

---

**Document Version:** 1.0  
**Last Updated:** 2025

