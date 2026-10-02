# Client Portal User & Testing Guide

Welcome to the **FieldWire Client Portal** documentation. This guide explains the features, access rules, registration workflows, and testing scenarios for both **Doctor (Physician)** and **Pharmacist** client roles.

---

## Table of Contents
1. [Self-Serve Account Registration](#1-self-serve-account-registration)
2. [Doctor Portal (Primary Client Access)](#2-doctor-portal-primary-client-access)
3. [Pharmacist Portal (Marketplace & Secondary Access)](#3-pharmacist-portal-marketplace--secondary-access)
4. [Demo & Testing Credentials](#4-demo--testing-credentials)

---

## 1. Self-Serve Account Registration

Clients (Doctors and Pharmacists) can register their own accounts without administrative intervention, provided their contact records already exist in the system's CRM database.

### How It Works:
1. Navigate to the Login page and click on the **Client (MD / Rx)** tab.
2. Click on the **Request Account Access** sub-tab.
3. Select your role: **Doctor (Physician)** or **Pharmacist**.
4. Enter your **Registered Email Address**, **Cell Phone Number**, and create a password.
5. **Verification Logic:** 
   * The system sanitizes the phone number (removes spaces, brackets, dashes) and matches the **last 10 digits** along with the **lowercase email** against the CRM tables:
     * Doctors are matched against the `fw_physician` table.
     * Pharmacists are matched against the `fw_pharmacist` table.
6. **Result:**
   * **Match Found:** The system automatically provisions a user account in `fw_users`, links it to the CRM contact record, assigns the client role, and immediately logs the user in.
   * **No Match / Duplicates:** The system displays a clear error message instructing the user to contact their project administrator.

---

## 2. Doctor Portal (Primary Client Access)

**Purpose:** Designed for Doctors to track the step-by-step progress of their clinic construction, view completed milestones, and prepare for the grand opening.

### Key Features & Constraints:
* **Project Isolation:** Doctors can only see projects where they are assigned as the **Primary Client**.
* **View-Only Access:** All creation, editing, and deletion controls are hidden. The interface is strictly read-only.
* **Tailored Sections:**
  * **Profile (Overview):** Displays high-level project details, start/end dates, and current status.
  * **Plans & Drawings:** Access to project documents.
    * *Security Filter:* Doctors can only view files inside folders containing `Documents`, `Drawings`, or `Resources MD` in their names. All other folders are hidden.
  * **Tasks:** View outstanding and completed tasks, assignees, and dates.
  * **Calendar:** Interactive calendar showing milestones and key dates.
  * **Photos:** Visual updates and site photos uploaded by the field team.
  * **Reports:** Access to generated project reports.
  * **Settings:** Read-only view of project settings.
* **Privacy:** The **Team** tab is completely hidden to protect the contact details of sub-contractors and internal staff.

---

## 3. Pharmacist Portal (Marketplace & Secondary Access)

Pharmacists have two distinct access modes depending on their relationship with the project.

### Mode A: Location Marketplace (Pharmacy Access 1)
If a pharmacist is looking for a new clinic location to partner with, they access the **Location Marketplace**.

#### Marketplace Logic:
1. **Status Filtering:** Only projects with the status `Actively Looking For A Location` or `Securing Location` are visible.
2. **Data Masking (Pre-NDA):** To protect proprietary data, critical fields are masked until an NDA is signed:
   * **Exact Address** is hidden (displays: *"Address Hidden (Confidential) • Step 1 NDA Required"*).
   * **Client Name (Doctor)** is hidden.
   * **Financials** (`Project Fee Per Doctor`, `Cost Per Sq Ft`, `Mark Up`) are hidden.
3. **Decision Toggles:** Pharmacists can mark projects as:
   * **Project I Want to Pursue** (Starts the pipeline).
   * **Not Interested** (Hides the project from their feed).

#### 4-Step Pursuit Progression:
When a pharmacist marks a `Securing Location` project as *"Pursue"*, the following workflow is initiated:
* **Step 1: Sign Digital NDA:** The pharmacist is prompted to digitally sign the NDA and Project Fees Agreement by typing their full legal name.
* **Step 2: Document Generation:** The system automatically generates a signed PDF/text agreement and uploads it directly to the project's file manager.
* **Step 3: Data Unlock:** Upon signing, the exact **Address** and **Client Name** are instantly revealed.
* **Step 4: Short Lease Agreement:** The pharmacist can view the Short Lease Agreement uploaded by the Project Manager, sign it digitally, or submit proposed modifications directly through the portal.

---

### Mode B: Project Partner (Pharmacy Access 2 / Secondary Client)
If a pharmacist is officially attached to an active project as a **Secondary Client**, they access the project detail view.

#### Key Features & Constraints:
* **View-Only Access:** Strictly read-only.
* **Tailored Sections:**
  * **Live Analytics:** Interactive charts showing project metrics and performance.
  * **Drawings & Resources:** Access to project documents.
    * *Security Filter:* Pharmacists can only view folders containing `Drawings`, `Pharmacy`, or `Resources` in their names (Doctor-specific folders are hidden).
  * **Calendar:** View project timeline and milestones.
  * **Photos:** Site photo updates.
  * **Reports:** View generated reports.
* **Hidden Sections:** The **Tasks**, **Settings**, and **Team** tabs are hidden.

---

## 4. Demo & Testing Credentials

Use these pre-configured credentials to demonstrate or test the client portal.

### Test Scenario 1: Direct Sign-In (Existing Accounts)
Go to **Client Sign In** and enter:

#### Doctor Demo Account
* **Email:** `drlekeoyedotun@outlook.com`
* **Password:** `password123`
* **Linked Project:** *Ellesmere Medical Clinic & Pharmacy* (Status: `Construction`)

#### Pharmacist Demo Account
* **Email:** `13monikaarora@gmail.com`
* **Password:** `password123`
* **Workflow:** Opens the **Location Marketplace** to test NDA & Lease signing.

---

### Test Scenario 2: Self-Serve Registration (New Accounts)
Go to **Request Account Access** and register these fresh records:

#### Register a New Doctor
* **Role:** Doctor (Physician)
* **Email:** `ale@vidamd.ca`
* **Phone:** `+16043797364` (or `604-379-7364`)
* **Password:** *Choose any password*

#### Register a New Pharmacist
* **Role:** Pharmacist
* **Email:** `1fascinatingmind@gmail.com`
* **Phone:** `+16134499775` (or `613-449-9775`)
* **Password:** *Choose any password*
