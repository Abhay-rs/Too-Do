// Task Manager - CRUD Operations with Time & Notifications
// Uses localStorage for persistence

const STORAGE_KEY = 'taskManager_tasks';
const PHONE_KEY = 'taskManager_phone';

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
const phoneInput = document.getElementById('phoneInput');
const savePhoneBtn = document.getElementById('savePhoneBtn');

let tasks = [];
let editingTaskId = null;

// Helpers for date/time inputs
function getMinLocalDateTimeString() {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function updateMinDateTimeInputs() {
    const minValue = getMinLocalDateTimeString();
    if (taskDueTime) taskDueTime.min = minValue;
    if (editDueTime) editDueTime.min = minValue;
}

function isPastInputDateTime(value) {
    if (!value) return false;
    const selected = new Date(value);
    const now = new Date();
    return selected < now;
}

// Initialize - Load tasks and phone from localStorage
function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];

    const storedPhone = localStorage.getItem(PHONE_KEY);
    if (storedPhone && phoneInput) {
        phoneInput.value = storedPhone;
    }

    updateMinDateTimeInputs();
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
    updateMinDateTimeInputs();
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

    updateMinDateTimeInputs();
    if (editDueTime.value && isPastInputDateTime(editDueTime.value)) {
        alert('Please choose a date and time from now or in the future.');
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
    if (!('Notification' in window)) {
        // Notifications not supported, keep banner visible to hint limitation
        return;
    }

    if (Notification.permission === 'granted') {
        notificationBanner.classList.add('hidden');
    } else {
        notificationBanner.classList.remove('hidden');
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Your browser does not support notifications. Try opening this page from a normal browser tab (http/https) instead of file://');
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
        checkDueTasksAndNotify();
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

function checkDueTasksAndNotify() {
    const now = new Date();
    let changed = false;
    const phone = localStorage.getItem(PHONE_KEY) || '';

    tasks.forEach(task => {
        if (task.dueAt && !task.notified && !task.completed) {
            const dueDate = new Date(task.dueAt);
            if (dueDate <= now) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    showTaskNotification(task);
                }
                if (phone) {
                    sendSms(phone, `Task due: ${task.text}`);
                }
                task.notified = true;
                changed = true;
            }
        }
    });

    if (changed) {
        saveTasks();
    }
}

function startNotificationChecker() {
    // Check every 5 seconds for due tasks
    setInterval(checkDueTasksAndNotify, 5000);
}

// ========== PHONE / SMS (SIMULATED) ==========

function isValidPhone(phone) {
    if (!phone) return false;
    // Very simple validation: starts with +, 8–20 digits total
    const cleaned = phone.replace(/\s+/g, '');
    return /^\+?\d{8,20}$/.test(cleaned);
}

function savePhoneNumber() {
    const value = phoneInput.value.trim();
    if (!value) {
        alert('Please enter a phone number.');
        return;
    }
    if (!isValidPhone(value)) {
        alert('Please enter a valid phone number (e.g. +1234567890).');
        return;
    }
    localStorage.setItem(PHONE_KEY, value);
    alert('Phone number saved. We will use it for SMS reminders.');
}

// This is a simulated SMS sender. In a real app you would
// call your backend API here (for example, a Twilio endpoint).
function sendSms(phone, message) {
    console.log('Simulated SMS to', phone, ':', message);
    // You can replace this with a real fetch() call to your server.
}

// Event Listeners
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateMinDateTimeInputs();
    if (taskDueTime.value && isPastInputDateTime(taskDueTime.value)) {
        alert('Please choose a date and time from now or in the future.');
        return;
    }
    const dueTime = taskDueTime.value ? new Date(taskDueTime.value).toISOString() : null;
    addTask(taskInput.value, dueTime);
});

saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', cancelEdit);

enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
savePhoneBtn.addEventListener('click', savePhoneNumber);

editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
});

// Initialize app
init();
