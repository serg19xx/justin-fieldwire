# FieldWire - Administrator User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Logging In](#logging-in)
3. [Main Menu](#main-menu)
4. [Dashboard](#dashboard)
5. [Project Management](#project-management)
6. [Team Management (Builders)](#team-management-builders)
7. [Reports](#reports)
8. [Account Settings](#account-settings)
9. [Administrative Settings](#administrative-settings)

---

## Introduction

FieldWire is a construction project management system designed for construction project support and management. This manual is intended for users with the **System Administrator** role.

### Administrator Role

The System Administrator has full access to all application features:
- Management of all projects in the system
- Management of all users and team members
- Configuration of system rules and message templates
- Access to all reports and analytics
- Assignment of project managers

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

### Available for Administrators:

1. **Dashboard** - Main dashboard with system overview
2. **Projects** - Management of all projects
3. **Builders** - Team and user management
4. **Reports** - View reports and analytics
5. **Account** - Account settings
6. **Admin Settings** - Administrative settings (administrators only)

---

## Dashboard

### Overview

The Administrator Dashboard provides a system overview:
- User statistics
- Current user information
- Quick access to main functions

### Dashboard Elements

- **User Management** - User management
- **System Settings** - System settings
- **Analytics** - System analytics

### User Information

The Dashboard displays information about the current user:
- **Category** - Role category (Global)
- **Role** - Role (admin)
- **Name** - User name
- **Email** - Email address
- **ID** - User identifier
- **Status** - Status (Active/Inactive)
- **2FA** - Two-factor authentication status (Enabled/Disabled)

---

## Project Management

### Project List

Access to the list of all projects through the **Projects** menu.

#### Project List Functions:

1. **Project Search**
   - Use the search field to filter projects by name
   - Search works in real-time

2. **Project Filtering**
   - By status (Active, Completed, On Hold, Draft)
   - By priority (High, Medium, Low)
   - By project manager

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
   - **Project Manager** - Project manager (only administrators can assign)
3. Click **"Create Project"**

### Viewing Project (Admin View)

Administrators have a special project view (`/projects/:id/admin`) that provides:
- Project overview
- Task statistics
- Team information
- Quick access to settings

### Editing a Project

1. Open a project from the list
2. Go to the **Settings** section
3. Change the necessary fields:
   - Project name
   - Address
   - Description
   - Priority
   - Status
   - Start and end dates
   - Project manager
4. Click **"Save Changes"**

### Deleting a Project

1. Open the project
2. Go to the **Settings** section
3. Click the **"Delete Project"** button
4. Confirm deletion

---

## Team Management (Builders)

### Access to Team Management

The **Builders** menu provides access to management of all system users.

### View Modes

1. **Registered** - Registered users
2. **Pending** - Users with pending invitations

### Team Management Functions

#### Search and Filtering

1. **Text Search**
   - Enter name, surname, email, or job title in the search field
   - Search works in real-time

2. **Filters**
   - **User Type** - Filter by user type (role)
   - **Status** - Filter by status (Active, Inactive)
   - **Invitation Status** - Filter by invitation status (Registered, Invited)

#### Viewing User Information

1. Click on a user card
2. A dialog opens with detailed information:
   - Personal information
   - Contact details
   - Role and access rights
   - System status
   - Activity history

#### Inviting a New User

1. Click the **"Invite Builder"** button
2. Fill in the invitation form:
   - **Email** * - User email address
   - **First Name** * - First name
   - **Last Name** * - Last name
   - **Role** - System role
   - **Job Title** - Job title
   - **Phone** - Phone number
3. Click **"Send Invitation"**

#### Editing a User

1. Open the user card
2. Click the **"Edit"** button
3. Change the necessary fields
4. Click **"Save Changes"**

#### Deleting a User

1. Open the user card
2. Click the **"Delete"** button
3. Confirm deletion

---

## Reports

### Access to Reports

The **Reports** menu provides access to various reports and analytics.

### Report Types

1. **Project Reports** - Project reports
2. **Task Reports** - Task reports
3. **Team Reports** - Team reports
4. **Performance Reports** - Performance reports

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
- **Full Photo** - Upload full photo
- **Gender** - Gender
- **Age/Birth Date** - Age/Birth date
- **Specialty/Job Title** - Specialty/Job title

#### 2. Contact Information

- **Email** - Email address
- **Phone** - Phone number
- **Address** - Address

#### 3. Security

- **Change Password** - Change password
- **Two-Factor Authentication** - Two-factor authentication

#### 4. Preferences

- **Language** - Interface language
- **Timezone** - Timezone
- **Notifications** - Notification settings

---

## Administrative Settings

### Access to Administrative Settings

The **Admin Settings** menu is available only for users with the **System Administrator** role.

### Administrative Settings Sections

#### 1. Event Rules

Event rules allow you to configure automatic actions when certain events occur in the system.

##### Viewing Rules

1. Open the **Event Rules** section
2. View the list of all rules:
   - **System Rules** - System rules (created by the system)
   - **Custom Rules** - Custom rules (created by administrators)

##### Filtering Rules

- By rule type (System/Custom)
- By event type
- By status (Enabled/Disabled)
- By execution location

##### Creating a New Rule

1. Click the **"Create Rule"** button
2. Fill in the form:
   - **Event Type** * - Event type
   - **Rule Name** * - Rule name
   - **Description** - Rule description
   - **Enabled** - Enabled/Disabled
   - **Execution Location** - Execution location (Frontend/Backend)
   - **Conditions** - Rule trigger conditions
   - **Actions** - Actions when rule is triggered
3. Click **"Create Rule"**

##### Editing a Rule

1. Find the rule in the list
2. Click the **"Edit"** button
3. Change the necessary fields
4. Click **"Update Rule"**

##### Deleting a Rule

**Important:** Only custom rules can be deleted. System rules cannot be deleted.

1. Find a custom rule in the list
2. Click the **"Delete"** button
3. Confirm deletion

#### 2. Message Templates

Message templates are used for automatic notification sending.

##### Template Types

- **Email Templates** - Email message templates
- **SMS Templates** - SMS message templates

##### Viewing Templates

1. Open the **Message Templates** section
2. Select template type (Email/SMS)
3. View the list of templates

##### Creating a New Template

1. Click the **"Create Template"** button
2. Fill in the form:
   - **Template Name** * - Template name
   - **Subject** - Message subject (for email)
   - **Body** * - Template text
   - **Variables** - Available variables for substitution
3. Click **"Create Template"**

##### Editing a Template

1. Find the template in the list
2. Click the **"Edit"** button
3. Change the necessary fields
4. Click **"Update Template"**

##### Deleting a Template

1. Find the template in the list
2. Click the **"Delete"** button
3. Confirm deletion

---

## Working with Projects (Detailed Overview)

### Project Structure

When opening a project, the administrator sees the following sections:

1. **Plans** - Plans and drawings
2. **Tasks** - Project tasks
3. **Photos** - Project photos
4. **Team** - Project team
5. **Settings** - Project settings

### Plans Section

#### File Management

1. **Uploading Files**
   - Click the **"Upload"** button
   - Select files to upload
   - Select destination folder
   - Click **"Upload"**

2. **Creating Folders**
   - Click the **"New Folder"** button
   - Enter folder name
   - Click **"Create"**

3. **Viewing Files**
   - Icons view (Icons View)
   - List view (Details View)

4. **File Operations**
   - **Preview** - View file
   - **Download** - Download file
   - **Rename** - Rename
   - **Move** - Move to another folder
   - **Delete** - Delete file

### Tasks Section

#### Viewing Tasks

Tasks are displayed in several views:
- **Calendar View** - Calendar view
- **Gantt View** - Gantt chart
- **List View** - Task list

#### Creating a Task

1. Click the **"New Task"** button or click on a date in the calendar
2. Fill in the form:
   - **Task Name** * - Task name
   - **WBS Path** - Work breakdown structure path
   - **Start Date** * - Start date
   - **End Date** * - End date
   - **Duration** - Duration (days)
   - **Status** - Status (Planned, In Progress, Done, Blocked, Delayed)
   - **Progress** - Completion progress (%)
   - **Task Lead** - Responsible person
   - **Team Members** - Team members
   - **Dependencies** - Dependencies on other tasks
   - **Resources** - Resources
   - **Notes** - Notes
3. Click **"Create Task"**

#### Creating a Milestone

1. Click the **"New Milestone"** button or select the option when creating a task
2. Fill in the form:
   - **Milestone Name** * - Milestone name
   - **Milestone Type** - Type (Inspection, Visit, Meeting, Review, Delivery, Approval, Other)
   - **Date** * - Milestone date
   - **Status** - Status
   - **Project Lead** * - Responsible person
   - **Invited People** - Invited people (external participants)
   - **Notes** - Notes
3. Click **"Create Milestone"**

#### Editing a Task

1. Click on a task in the calendar or list
2. The editing dialog opens
3. Change the necessary fields
4. Click **"Save Changes"**

#### Editing a Milestone

1. Click on a milestone in the calendar
2. The milestone editing dialog opens
3. Change the necessary fields
4. Click **"Save Changes"**

#### Deleting a Task/Milestone

1. Open the task/milestone for editing
2. Click the **"Delete"** button
3. Confirm deletion

#### Duplicating a Task

1. Open the task for editing
2. Click the **"Duplicate"** button
3. The task will be copied with a new name

#### Task Dependencies

1. Open the task for editing
2. Go to the **Dependencies** section
3. Click **"Add Dependency"**
4. Select the predecessor task
5. Select dependency type:
   - **FS (Finish-to-Start)** - Finish-to-start
   - **SS (Start-to-Start)** - Start-to-start
   - **FF (Finish-to-Finish)** - Finish-to-finish
   - **SF (Start-to-Finish)** - Start-to-finish
6. Specify lag (lag days)
7. Click **"Add"**

#### Assigning Team to Task

1. Open the task for editing
2. Go to the **Team & Resources** section
3. Select **Task Lead** - responsible for the task
4. Select **Team Members** - team members to execute the task
5. Click **"Save Changes"**

#### Exporting Tasks to iCal

1. Open the **Tasks** section
2. Click the **"Export to iCal"** button
3. The file will be downloaded in .ics format

### Photos Section

#### Uploading Photos

1. Click the **"Upload Photo"** button
2. Select photos
3. Add description (optional)
4. Click **"Upload"**

#### Viewing Photos

- Photos are displayed as a gallery
- Click on a photo to view in full size

### Team Section

#### Viewing Project Team

The Team section displays a list of all project team members with information:
- Name and photo
- Role in project
- Assigned tasks
- Status

#### Adding Team Member

1. Click the **"Add Team Member"** button
2. Select a user from the list of available users
3. Select role in project
4. Click **"Add"**

#### Viewing Team Member Details

1. Click on a team member card
2. A dialog opens with detailed information:
   - Personal information
   - Role in project
   - Assigned tasks
   - Activity history

#### Deleting Team Member

1. Open team member details
2. Click the **"Remove from Project"** button
3. Confirm deletion

#### Assigning Worker to Task

1. In the Team section, find the task
2. Click the **"Assign Worker"** button
3. Select worker from the list
4. Click **"Assign"**

#### Removing Worker from Task

1. In the Team section, find the task
2. Find the assigned worker
3. Click the **"Remove"** button next to the worker
4. Confirm removal

### Settings Section

#### Basic Project Settings

- **Project Name** - Project name
- **Address** - Project address
- **Description** - Project description
- **Priority** - Priority (High, Medium, Low)
- **Status** - Status (Draft, Active, On Hold, Completed)
- **Start Date** - Project start date
- **End Date** - Project end date
- **Project Manager** - Project manager (only administrator can change)

#### Saving Changes

1. Change the necessary fields
2. Click the **"Save Changes"** button
3. Changes will be saved

---

## Tips and Recommendations

### Security

- Change your password regularly
- Use two-factor authentication
- Do not share your credentials with others

### Performance

- Use filters for quick project and task search
- Export data for analysis outside the system
- Regularly check and clean inactive projects

### Best Practices

- Always fill in project description when creating
- Set realistic project start and end dates
- Assign responsible person for each task
- Regularly update task statuses
- Use milestones to track key events

---

## Support

If you have questions or issues:
1. Check this manual
2. Contact the system administrator
3. Contact technical support

---

**Document Version:** 1.0  
**Last Updated:** 2025

