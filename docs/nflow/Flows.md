# Flows

The **Flows Screen** in nFlow Setup is where users manage automation processes to streamline business operations. Flows are used to automate repetitive tasks, manipulate data, and integrate system interactions without requiring extensive coding expertise.

---

## **📌 Key Sections of the Flows Screen**

### **1️⃣ Quick Tips Section (Purple Banner at the Top)**

- Provides a brief overview of what flows are and how they enhance efficiency.
- Includes links to **Learn More** and **Watch Tutorial** for additional guidance.

### **2️⃣ Search and Filtering Options**

- A **search bar** to find specific flows by name.
- Multiple **filters** to narrow results by **Flow Type, Tags, and Metadata**.

### **3️⃣ Flow Management Actions**

- **New Flow Button (Top Right, Purple)** → Allows users to create a new flow.
- **Bulk Actions (Icons Next to Search Bar)** → Includes options to archive, delete, or manage multiple flows at once.

---

## **🛠 Types of Flows in nFlow**

nFlow provides **five types of flows**, each designed for different automation needs:

![image.png](Flows%201c820e86a544813aa601c8372d42e6c8/image.png)

### **1️⃣ Screen Flow** *(User Interaction-Based)*

- **Triggered by user actions**, such as filling out a form or clicking a button.
- Often used for guided processes like **onboarding, form submissions, or approvals**.
- Supports **custom React components**, allowing for dynamic and interactive UI elements.

📌 *Example Use Case:* A **"New User Registration"** flow that asks users for their details and dynamically updates the system.

---

### **2️⃣ Action Flow** *(No UI, Background Execution)*

- **Executed automatically in the background**, without user interaction.
- Can be triggered via an **API call, another flow, or an event**.
- Used for **data processing, external API calls, or automated updates**.

📌 *Example Use Case:* An **"Auto-Assign Support Tickets"** flow that assigns new support requests to agents based on workload.

---

### **3️⃣ Platform Event Flow** *(Event-Driven Automation)*

- Triggered **when a platform event message is received** from an external system or another flow.
- Useful for **real-time event processing**, such as responding to webhook notifications.

📌 *Example Use Case:* A **"Payment Received"** event flow that updates a customer’s order status upon successful payment.

---

### **4️⃣ Data Manipulation Flow** *(CRUD-Based Triggers)*

- Runs **automatically when a record is created, updated, or deleted** in nFlow.
- Allows users to define conditions based on field values to control when the flow executes.

📌 *Example Use Case:* A **"Lead Qualification"** flow that updates a lead’s status when their score reaches a certain threshold.

---

### **5️⃣ Time-Based Flow** *(Scheduled Automation)*

- Triggered at **specific scheduled times or intervals** (e.g., daily, weekly, or monthly).
- Used for **recurring reports, scheduled notifications, or batch processing**.

📌 *Example Use Case:* A **"Monthly Billing Reminder"** flow that sends automated payment reminders to customers.