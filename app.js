// Task Manager - CRUD Operations with Time & Notifications
// Uses localStorage for persistence

const STORAGE_KEY = 'taskManager_tasks';

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskDueTime = document.getElementById('taskDueTime');
const submitBtn = document.getElementById('submitBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const editForm = document.getElementById('editForm');
const editInput = document.getElementById('editInput');
const editDueTime = document.getElementById('editDueTime');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const notificationBanner = document.getElementById('notificationBanner');
const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

let tasks = [];
let editingTaskId = null;

// Initialize - Load tasks from localStorage
function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
    renderTasks();
    checkNotificationPermission();
    startNotificationChecker();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Format date/time for display
function formatDateTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
        return 'Today at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// CREATE - Add new task
function addTask(text, dueTime = null) {
    if (!text || !text.trim()) return;

    const task = {
        id: generateId(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueAt: dueTime || null,
        notified: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskDueTime.value = '';
    taskInput.focus();
}

// READ - Render all tasks
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        if (editingTaskId === task.id) li.classList.add('editing');

        const createdStr = formatDateTime(task.createdAt);
        let timeHtml = `<span class="created">Added: ${createdStr}</span>`;
        if (task.dueAt) {
            const dueDate = new Date(task.dueAt);
            const isOverdue = dueDate < new Date() && !task.completed;
            timeHtml += ` <span class="${isOverdue ? 'overdue' : 'due'}">Due: ${formatDateTime(task.dueAt)}</span>`;
        }

        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <div class="task-time">${timeHtml}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" data-id="${task.id}">Edit</button>
                <button class="btn btn-delete" data-id="${task.id}">Delete</button>
            </div>
        `;

        taskList.appendChild(li);
    });

    // Attach event listeners
    taskList.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editTask(btn.dataset.id));
    });
    taskList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
}

// UPDATE - Edit existing task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    editInput.value = task.text;
    editDueTime.value = task.dueAt ? task.dueAt.slice(0, 16) : '';
    editForm.classList.remove('hidden');
    taskInput.disabled = true;
    taskDueTime.disabled = true;
    editInput.focus();
    renderTasks();
}

function saveEdit() {
    if (editingTaskId === null) return;

    const text = editInput.value.trim();
    if (!text) {
        cancelEdit();
        return;
    }

    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        task.text = text;
        task.dueAt = editDueTime.value ? new Date(editDueTime.value).toISOString() : null;
        task.updatedAt = new Date().toISOString();
        task.notified = false; // Reset so new due time can trigger notification
        saveTasks();
    }

    cancelEdit();
    renderTasks();
}

function cancelEdit() {
    editingTaskId = null;
    editInput.value = '';
    editDueTime.value = '';
    editForm.classList.add('hidden');
    taskInput.disabled = false;
    taskDueTime.disabled = false;
    taskInput.focus();
    renderTasks();
}

// DELETE - Remove task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    if (editingTaskId === id) cancelEdit();
    renderTasks();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== NOTIFICATIONS ==========

function checkNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        notificationBanner.classList.add('hidden');
    } else if (Notification.permission !== 'denied') {
        notificationBanner.classList.remove('hidden');
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Your browser does not support notifications.');
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        notificationBanner.classList.add('hidden');
        // Show a test notification
        new Notification('Task Manager', {
            body: 'Notifications enabled! You\'ll get reminders for your tasks.',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232d6a4f"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
        });
    }
}

function showTaskNotification(task) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    new Notification('Task Reminder', {
        body: task.text,
        tag: task.id,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232d6a4f"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
    });
}

function startNotificationChecker() {
    // Check every 30 seconds for due tasks
    setInterval(() => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const now = new Date();
        tasks.forEach(task => {
            if (task.dueAt && !task.notified && !task.completed) {
                const dueDate = new Date(task.dueAt);
                // Notify when due (within 1 minute window)
                if (dueDate <= now || (dueDate - now) < 60000) {
                    showTaskNotification(task);
                    task.notified = true;
                    saveTasks();
                }
            }
        });
    }, 30000);
}

// Event Listeners
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dueTime = taskDueTime.value ? new Date(taskDueTime.value).toISOString() : null;
    addTask(taskInput.value, dueTime);
});

saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', cancelEdit);

enableNotificationsBtn.addEventListener('click', requestNotificationPermission);

editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
});

// Initialize app
init();
