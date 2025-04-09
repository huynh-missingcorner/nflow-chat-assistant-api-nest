# Intent Agent – Required Nflow Context

This document summarizes the essential platform knowledge that the Intent Agent needs to generate high-level execution plans for the Nflow micro-agent system.

## Applications in Nflow

### What is Applications?

An Application in **Nflow** is the top-level container or project that holds everything else. Think of it as the main workspace where all objects, pages (layouts), flows, and settings are bundled together to form a complete no-code app.

### Features of the App Viewer

- **Multiple Applications**: Users can access various applications based on their roles within the organization. These apps may handle different aspects of the business, such as sales, customer support, or resources.
- **App Layouts**: Each application consists of several layouts or tabs, where users interact with features like **dashboards**, **record lists**, and **task flows**.
- **User-Specific Customization**: Each user's experience is personalized according to their assigned **profile**. Layouts and available apps differ based on job roles and responsibilities.
- **Data and Workflow Management**: Users can view, edit, and create records, trigger flows, or complete tasks assigned to them. These actions are directly related to the apps they are permitted to use.

### Example Use Cases of App Relationships Between Users

1. **Sales App for a Sales Representative and Marketing App for a Marketing User**:

- **Sales Representative’s App (Sales Application)**:
  - The Sales Rep uses an app that has access to tabs like **Leads**, **Opportunities**, and **Accounts**. They can create new leads and update opportunity stages.
  - For example, the Sales Rep updates an opportunity when it reaches the proposal stage and requests marketing materials.
- **Marketing User’s App (Marketing Application)**:
  - The Marketing User has access to an app where they can view requests from Sales Reps for marketing materials. The app could include tabs like **Campaigns** and **Marketing Materials**.
  - Once the Sales Rep requests materials via a flow, it triggers an action in the Marketing App, alerting the Marketing User to provide the requested materials. The marketing team uploads relevant documents or links to their resources and updates the status of the request, which is visible to the Sales Rep.

2. **Support App for a Customer Support Agent and Account Management App for a Customer Manager**

- **Support Agent’s App (Support Application)**:
  - The Support Agent uses an app that gives them access to **Cases**, **Knowledge Base**, and **Customer Inquiries**. When a customer submits an issue, it gets logged into the system as a case.
  - The Support Agent can escalate certain cases that need further involvement from the Account Manager by changing the case status to "Escalated."
- **Customer Manager’s App (Account Management Application)**:
  - The Customer Manager accesses a different app where they see a tab for **Escalated Cases** linked to their customer accounts.
  - When a support case is escalated, it appears in their dashboard, where they can review the issue, reach out to the customer, or coordinate with the Support Agent to resolve the problem.

3. **Project App for a Project Manager and HR App for an HR Representative**

- **Project Manager’s App (Project Application)**:
  - The Project Manager uses an app to manage ongoing projects, access tabs like **Project Timeline**, **Resources**, and **Tasks**. When additional resources (personnel) are needed for a project, the Project Manager can raise a request for additional team members through a flow.
- **HR Representative’s App (HR Application)**:
  - The HR Representative has a separate app to manage employee assignments and view **Resource Requests**.
  - When the Project Manager submits a request for additional personnel, the HR team receives the request in their HR app, where they can review availability and assign the requested personnel to the project. They update the assignment, which is reflected in the Project Manager’s app for tracking.

## Objects in Nflow

### What is Objects?

In the **Nflow** platform, an Object is essentially a database entity or table. It represents structured data you want to store, manipulate, or display in your application.

Think of it like a model in traditional backend systems.

### Responsibilities of a Object in Nflow

Objects are used for:

- Storing structured records (like rows in a table)
- Managing relationships between data types
- Powering UI components via bindings (tables, forms)
- Driving logic via Flows (e.g., “when a new Lead is created…”)

## Layout in Nflow

### What is Layout?

In **Nflow**, a layout defines how data is visually presented and interacted with in the application — like pages, sections, and UI components (widgets). It’s essentially the UI structure that binds to your backend objects.

You can think of it as: Layout = Page Structure + Components + Data Bindings

### Responsibilities of a Layout in Nflow

A layout is used to:

- Define application pages (e.g., Dashboard, Add Expense, View Leads)
- Bind UI components to objects (e.g., show a table of Expenses)
- Configure components/widgets (form inputs, tables, buttons, filters)
- Customize behavior via layout scripts
- Assign layouts to applications and user profiles

## Flows in Nflow

### What is Flows?

In Nflow, a Flow defines the logic, automation, or sequence of interactions that occur in your application.

Think of Flows as: Business logic + automation + screen navigation

### Responsibilities of Flows in Nflow

They are used to:

- Trigger actions when something happens (e.g. “when a form is submitted…”)
- Automate multi-step processes (e.g. onboarding, approvals)
- Handle input/output between pages
- Control screen-to-screen navigation
- Update data, run conditions, or activate backend processes
