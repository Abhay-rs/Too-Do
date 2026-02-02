This project is written in Vanilla JavaScript, it is incredibly lightweight. It doesn't use Node.js, React, or any external libraries, which means there are zero dependencies to install!

Task Manager (JS Native)
A lightweight, browser-based Task Manager with CRUD functionality, persistence via localStorage, and native desktop notifications.

🚀 Getting Started
Because this project uses standard web technologies, you don't need to install npm or any external packages.

Prerequisites
A modern web browser (Chrome, Firefox, Edge, or Safari).

A code editor (like VS Code) if you wish to modify the code.

Installation & Launch
Clone or Download this repository to your local machine.

Ensure you have the following three files in the same folder:

index.html (The structure)

style.css (The styling - ensure you have created this)

script.js (The logic provided in your snippet)

Launch the app:

Option A (Simplest): Double-click the index.html file to open it in your browser.

Option B (Recommended): If using VS Code, right-click index.html and select "Open with Live Server" to handle local file permissions more smoothly.

🛠 Features
Full CRUD: Create, Read, Update, and Delete tasks.

Data Persistence: Tasks are saved in your browser's localStorage.

Due Date Reminders: Set specific times for tasks.

Smart Notifications: Desktop alerts when a task is due (requires user permission).

XSS Protection: Sanitizes user input to keep the application secure.

Opens in a new window
Shutterstock
Explore
📦 Dependencies
None. * This project is built with "Vanilla" JavaScript, meaning it runs natively in the browser without the need for frameworks or libraries.

🔔 Important Note on Notifications
For the notification system to work:

You must click the "Enable Notifications" button in the app.

If you are opening the file directly (using file:// in the URL), some browsers may block notifications for security. It is best to run the project using a local server (like the Live Server extension in VS Code).

📝 How to Use
Add a Task: Enter the task name and optional due date, then press "Add Task".

Edit: Click the "Edit" button to change the text or due time.

Delete: Click "Delete" to permanently remove a task.

Notifications: Keep the tab open in your browser to receive alerts when a task is due.
