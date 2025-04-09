# Applications

The **App Viewer** in **Nuclent nFlow** serves as the central hub where users interact with different applications assigned to them. Although there is **no mobile support currently**, it provides a highly customizable desktop interface where applications are organized into tabs, allowing users to access features like data records, dashboards, and workflows. Each app is tailored to the user's **profile** and **role**, ensuring that users only access the functionalities they are permitted to use.

### Features of the App Viewer:

- **Multiple Applications**: Users can access various applications based on their roles within the organization. These apps may handle different aspects of the business, such as sales, customer support, or resources.
- **App Layouts**: Each application consists of several layouts or tabs, where users interact with features like **dashboards**, **record lists**, and **task flows**.
- **User-Specific Customization**: Each user's experience is personalized according to their assigned **profile**. Layouts and available apps differ based on job roles and responsibilities.
- **Data and Workflow Management**: Users can view, edit, and create records, trigger flows, or complete tasks assigned to them. These actions are directly related to the apps they are permitted to use.

### Example Use Cases of App Relationships Between Users:

1. **Sales App for a Sales Representative and Marketing App for a Marketing User**:

- **Sales Representative’s App (Sales Application)**:
  - The Sales Rep uses an app that has access to tabs like **Leads**, **Opportunities**, and **Accounts**. They can create new leads and update opportunity stages.
  - For example, the Sales Rep updates an opportunity when it reaches the proposal stage and requests marketing materials.
- **Marketing User’s App (Marketing Application)**:
  - The Marketing User has access to an app where they can view requests from Sales Reps for marketing materials. The app could include tabs like **Campaigns** and **Marketing Materials**.
  - Once the Sales Rep requests materials via a flow, it triggers an action in the Marketing App, alerting the Marketing User to provide the requested materials. The marketing team uploads relevant documents or links to their resources and updates the status of the request, which is visible to the Sales Rep.

1. **Support App for a Customer Support Agent and Account Management App for a Customer Manager**:

- **Support Agent’s App (Support Application)**:
  - The Support Agent uses an app that gives them access to **Cases**, **Knowledge Base**, and **Customer Inquiries**. When a customer submits an issue, it gets logged into the system as a case.
  - The Support Agent can escalate certain cases that need further involvement from the Account Manager by changing the case status to "Escalated."
- **Customer Manager’s App (Account Management Application)**:
  - The Customer Manager accesses a different app where they see a tab for **Escalated Cases** linked to their customer accounts.
  - When a support case is escalated, it appears in their dashboard, where they can review the issue, reach out to the customer, or coordinate with the Support Agent to resolve the problem.

1. **Project App for a Project Manager and HR App for an HR Representative**:

- **Project Manager’s App (Project Application)**:
  - The Project Manager uses an app to manage ongoing projects, access tabs like **Project Timeline**, **Resources**, and **Tasks**. When additional resources (personnel) are needed for a project, the Project Manager can raise a request for additional team members through a flow.
- **HR Representative’s App (HR Application)**:
  - The HR Representative has a separate app to manage employee assignments and view **Resource Requests**.
  - When the Project Manager submits a request for additional personnel, the HR team receives the request in their HR app, where they can review availability and assign the requested personnel to the project. They update the assignment, which is reflected in the Project Manager’s app for tracking.

---

# Guide to Creating a New Application in nFlow:

Creating a new application in nFlow involves setting up basic details and optionally configuring advanced settings to integrate third-party services or add custom scripts. Below is a comprehensive step-by-step guide:

![image.png](Applications%201c820e86a544818e8ea9e85cdb197452/image.png)

### Step 1: Open the Applications Section

1. Navigate to the **Setup View** in nFlow.
2. Click on **Applications** from the left-hand menu to view the list of existing applications.

### Step 2: Initiate a New Application

1. Click the **New Application** button in the top-right corner to open the **Create New Application** modal.

### Step 3: Fill in the Basic Information

1. **Display Name**:
   - Enter a descriptive name for the application.
   - Example: `Task Manager`
2. **API Name**:
   - Provide a unique identifier for the application, used in backend processes.
   - Example: `taskManagerApp`
3. **Profiles**:
   - Select the profiles that can access the application. `Admin` is selected by default.
   - Add additional profiles as necessary.
4. **Description** (Optional):
   - Describe the application's purpose.
   - Example: `An application for managing tasks across teams.`
5. **Tags** (Optional):
   - Add tags for easier categorization.
   - Example: `Project Management`
6. **Primary Color**:
   - Choose a color to brand your application.

### Step 4: Configure Advanced Settings

If you need to configure integrations or scripts, click on **Show advanced settings**.

1. **Integration Credentials**:
   - Select or search for credentials to connect the application with third-party services (e.g., API keys or OAuth tokens).
2. **Header Scripts**:
   - Add custom scripts that will be injected into the header of your application.
   - Use the `+` button to add multiple scripts if needed.
   - Example: Analytics tracking code.
3. **Footer Script**:
   - Enter HTML or JavaScript that will be added to the footer of your application.
   - Example: Custom footer text or additional tracking scripts.

### Step 5: Submit the Application

1. After filling out the necessary information, including any advanced settings, click the **Submit** button to create your application.
2. The new application will now appear in the list, ready for further development and customization.

### Next Steps

After creating the application:

- **Design Layouts**: Use the Layout Builder to set up App and Record Layouts.
- **Define Automations**: Create Flows to automate processes.
- **Assign Permissions**: Ensure the right users have access through Profiles and Roles.

By following these steps, you can create a fully functional application in nFlow, with optional integrations and customizations.

---

# Application Details and other settings:

After creating an application in nFlow, the **Application Details Page** provides a central location for managing the app's settings, user access, and layout structure. This guide includes detailed instructions for the **User Profiles** and **App Pages** sections, helping you efficiently manage user permissions and layout configurations.

![image.png](Applications%201c820e86a544818e8ea9e85cdb197452/image%201.png)

### **1. Viewing Application Details**

When you select an application from the **Applications** list, you are taken to the **Details** page, where you can view:

- **Application Name** and **API Name**: Display and API names of the application.
- **Description**: A short summary of the application's purpose.
- **Header Script** and **Footer Script**: Custom scripts injected into the app's header or footer.
- **Created At** and **Last Updated At**: The timestamps indicating when the application was created and last updated.
- **Tags**: Keywords associated with the app for easy categorization.
- **Avatar**: A color-coded icon representing the app.

### **2. Audit Logs and History**

- Use the **History** button to view the audit logs, which track changes made to the application, including who made the changes and when.

### **3. Editing Application Details**

- Click **Edit** to update the application’s name, description, or scripts. Once the changes are made, click **Save** to apply them.

### **4. User Profiles Section**

The **User Profiles** section allows you to control which user profiles have access to the application. This section contains two scrollable lists:

- **Available** (left): Lists profiles that do not currently have access to the app.
- **Selected** (right): Lists profiles that already have access.

**Steps to Manage User Profiles**:

1. **Select Profiles**:
   - Check the profiles in the **Available** list that you want to give access to.
2. **Move Profiles to Selected**:
   - Click the >> button to move the selected profiles from **Available** to **Selected**.
3. **Revoke Access**:
   - To remove access, select profiles from the **Selected** list and click the << button to move them back to **Available**.
4. **Save Changes**:
   - Click **Save** to apply the changes and update the user access permissions.

### **5. App Pages Section**

In the **App Pages** section, you manage the structure and layout of the application. This section is divided into two main areas:

- **App Layout**: Represents the front page or main interface of the application. It consists of different tabs that users can interact with.
- **Record Layout**: Defines the layout for viewing the details of individual records when a user selects a record from the **App Layout**.

**Key Functions in App Pages**:

- **Drag & Drop Tabs**: You can reorder the tabs in the **App Layout** by dragging and dropping them into the desired order.
- **Create Page**: Clicking the **Create Page** button redirects you to the **Layouts Builder** screen, where you can design new layouts for either **App Layout** or **Record Layout** using drag-and-drop components.

**Steps to Manage or Create Pages**:

1. **Reorder Tabs**:
   - Drag the tabs in the **App Layout** to rearrange them according to your preferred order.
2. **Create New Page**:
   - Click the **Create Page** button to open the **Layouts Builder**.
   - Design the layout by dragging and dropping components such as sections, grids, text inputs, buttons, and record lists.
   - Save the layout to apply it to the app.
