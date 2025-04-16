# Objects

In **Nuclent nFlow**, the **Objects** section is a powerful interface that allows administrators to manage data structures efficiently. Objects function like database tables, each containing records (rows) and fields (columns). Here's an overview of the key features in the Objects management interface, which helps users interact with, create, and manage objects effectively:

# Key Features of the Objects Interface

![image.png](Objects%201c820e86a54481b19311e2e7218b1d62/image.png)

## **Search bar**

- The **Search Bar** allows users to quickly search for specific objects by name or keyword. This is helpful when the system has many objects, making it easier to locate the desired one without scrolling through long lists.

## **Filter By Tags**

- This feature provides a **Filter By Tags** bar, where users can apply multiple filters simultaneously. Tags help organize objects based on categories or use cases. The multi-select functionality ensures users can apply several tags to refine the list of objects being viewed.

[[**Objects Schema Viewer**](https://m5rcxa7oqop.sg.larksuite.com/wiki/P3QpwIL0fi0Wvck0cGrl7nNEg3c)](https://www.notion.so/Objects-Schema-Viewer-1c820e86a5448147a708f0d88ab6ac78?pvs=21)

## **Archived Objects**

- The **Archived Objects** opens a window where users can view, search for, and recover **archived objects**. Archived objects are those that have been deactivated but can be restored if needed. Users can use the search functionality within this window to locate specific archived objects and decide whether to recover or permanently delete them.

## **Import/Export**

- Administrators can **import or export objects** as needed. The import functionality allows users to bring in objects from other environments, typically through a JSON file. The export option lets users export objects’ data structures for backup or use in other systems. This feature ensures that system configurations can be easily transferred between environments.

## **New Object**

- The **New Object Button** opens a modal to create a new object. Users are prompted to provide essential details such as:
  - **Display Name**: A user-friendly name visible in the interface.
  - **API Name**: A unique identifier used in back-end processes.
  - **Record Name**: The naming convention for individual records within the object.
  - **Object Permissions (OWD)**: Permissions for controlling whether the object is public, read-only, or private.
  - **Description**: Optional details about the purpose of the object.

## **Objects List**

![image.png](Objects%201c820e86a54481b19311e2e7218b1d62/image%201.png)

- This section lists all available objects with multiple key columns:
  - **Display Name**: The user-friendly name of the object.
  - **Tags Column**: Tags associated with each object for easier filtering and categorization.
  - **Metadata Column**: A summary of important information about the object (such as whether it's a custom object, its record count, and data types).
  - **Last Modified Column**: The date and time when the object was last updated, helping users track recent changes.
  - **Menu Button**: At the right end of each row, a menu button provides various options for each object:
    - **View Details**: Opens a detailed view of the object, including its fields and relationships.
    - **Edit**: Enables editing of the object’s schema, including adding or modifying fields.
    - **View Activity**: Shows a history of changes made to the object (e.g., creation, updates).
    - **Export**: Allows exporting the object’s schema and data.
    - **Archive**: Moves the object to the archive, where it can be recovered later if needed
