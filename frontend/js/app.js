// Main application logic
let socket;
let currentUser;
let currentView = 'dashboard';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Get current user
    currentUser = getCurrentUser();
    
    if (!currentUser) {
        logout();
        return;
    }
    
    // Initialize theme
    initializeTheme();
    
    // Update UI with user info
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Show/hide navigation items based on role
    const managementRoles = ['admin', 'manager'];
    const adminOnly = ['admin'];
    
    // Admin sees everything - no restrictions
    if (currentUser.role === 'admin') {
        // Admin has access to all features - show everything
        document.getElementById('allTasksNav').style.display = 'block';
        document.getElementById('reportsNav').style.display = 'block';
           document.getElementById('stockNav').style.display = 'block';
        document.getElementById('usersNav').style.display = 'block';
        document.getElementById('permissionsNav').style.display = 'block';
    } else if (managementRoles.includes(currentUser.role)) {
        // Managers see most features except permissions
        document.getElementById('allTasksNav').style.display = 'block';
        document.getElementById('reportsNav').style.display = 'block';
           document.getElementById('stockNav').style.display = 'block';
        document.getElementById('usersNav').style.display = 'block';
        document.getElementById('permissionsNav').style.display = 'block';
    } else {
        // Other roles see limited features
        document.getElementById('allTasksNav').style.display = 'none';
        document.getElementById('reportsNav').style.display = 'none';
           document.getElementById('stockNav').style.display = 'none';
        document.getElementById('usersNav').style.display = 'none';
        document.getElementById('permissionsNav').style.display = 'none';
    }
    
    // Initialize Socket.io
    initializeSocket();
    
    // Load initial data
    await loadDashboard();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load notifications
    loadNotifications();
});

// Initialize Socket.io connection
function initializeSocket() {
    socket = io({
        auth: {
            token: getAuthToken()
        }
    });
    
    socket.on('connect', () => {
        console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
    
    socket.on('new_task', (data) => {
        showToast(`New task assigned: ${data.title}`, 'info');
        if (currentView === 'dashboard' || currentView === 'tasks') {
            loadCurrentView();
        }
        loadNotifications();
    });
    
    socket.on('new_shift_duty', (data) => {
        showToast(`New shift duty for ${data.date}: ${data.title}`, 'info');
        if (currentView === 'dashboard' || currentView === 'tasks') {
            loadCurrentView();
        }
        loadNotifications();
    });
    
    socket.on('task_completed', (data) => {
        showToast(`Task completed by ${data.completedBy}: ${data.title}`, 'success');
        if (currentView === 'dashboard' || currentView === 'all-tasks') {
            loadCurrentView();
        }
    });
    
    socket.on('task_updated', (data) => {
        if (currentView === 'dashboard' || currentView === 'tasks' || currentView === 'all-tasks') {
            loadCurrentView();
        }
    });
    
    socket.on('task_deleted', (data) => {
        if (currentView === 'dashboard' || currentView === 'tasks' || currentView === 'all-tasks') {
            loadCurrentView();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            mobileOverlay.classList.toggle('active');
        });
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            if (view) {
                // Close mobile menu when navigating
                sidebar.classList.remove('open');
                mobileOverlay.classList.remove('active');
                switchView(view);
            }
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Create task buttons - show for admin, manager, supervisor
    const canCreateTasks = ['admin', 'manager', 'supervisor'].includes(currentUser.role);
    
    if (document.getElementById('createTaskBtn')) {
        if (canCreateTasks) {
            document.getElementById('createTaskBtn').style.display = 'inline-flex';
            document.getElementById('createTaskBtn').addEventListener('click', () => openTaskModal());
        } else {
            document.getElementById('createTaskBtn').style.display = 'none';
        }
    }
    
    if (document.getElementById('createTaskBtn2')) {
        if (canCreateTasks) {
            document.getElementById('createTaskBtn2').style.display = 'inline-flex';
            document.getElementById('createTaskBtn2').addEventListener('click', () => openTaskModal());
        } else {
            document.getElementById('createTaskBtn2').style.display = 'none';
        }
    }
    
    // Task modal
    document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', closeTaskModal);
    document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
    
    // Task assignment type change
    document.getElementById('taskAssignmentType').addEventListener('change', (e) => {
        const type = e.target.value;
        const assignedToGroup = document.getElementById('assignedToGroup');
        const assignedDateGroup = document.getElementById('assignedDateGroup');
        
        if (type === 'individual') {
            assignedToGroup.style.display = 'block';
            assignedDateGroup.style.display = 'none';
            document.getElementById('taskAssignedTo').required = true;
            document.getElementById('taskAssignedDate').required = false;
        } else if (type === 'shift-based') {
            assignedToGroup.style.display = 'none';
            assignedDateGroup.style.display = 'block';
            document.getElementById('taskAssignedTo').required = false;
            document.getElementById('taskAssignedDate').required = true;
        } else {
            assignedToGroup.style.display = 'none';
            assignedDateGroup.style.display = 'none';
            document.getElementById('taskAssignedTo').required = false;
            document.getElementById('taskAssignedDate').required = false;
        }
    });
    
    // Task details modal
    document.getElementById('closeTaskDetailsModal').addEventListener('click', closeTaskDetailsModal);
    document.getElementById('closeDetailsBtn').addEventListener('click', closeTaskDetailsModal);
    
    // Complete task modal
    document.getElementById('closeCompleteModal').addEventListener('click', closeCompleteTaskModal);
    document.getElementById('cancelCompleteBtn').addEventListener('click', closeCompleteTaskModal);
    document.getElementById('submitCompleteBtn').addEventListener('click', submitCompleteTask);
    
    // Filter tasks
    if (document.getElementById('filterTasksBtn')) {
        document.getElementById('filterTasksBtn').addEventListener('click', () => {
            const filters = document.getElementById('taskFilters');
            filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (document.getElementById('applyFiltersBtn')) {
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            loadMyTasks();
        });
    }
    
    // Export tasks
    if (document.getElementById('exportTasksBtn')) {
        document.getElementById('exportTasksBtn').addEventListener('click', exportTasks);
    }
    
    // Report generation
    if (document.getElementById('reportType')) {
        document.getElementById('reportType').addEventListener('change', handleReportTypeChange);
    }
    
    if (document.getElementById('reportForm')) {
        document.getElementById('reportForm').addEventListener('submit', generateReport);
    }
    
    // Mark all notifications read
    if (document.getElementById('markAllReadBtn')) {
        document.getElementById('markAllReadBtn').addEventListener('click', markAllNotificationsRead);
    }
    
    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', changePassword);
    
    // Theme toggle
    if (document.getElementById('lightModeBtn')) {
        document.getElementById('lightModeBtn').addEventListener('click', () => setTheme('light'));
    }
    
    if (document.getElementById('darkModeBtn')) {
        document.getElementById('darkModeBtn').addEventListener('click', () => setTheme('dark'));
    }
    
    // User management
    if (document.getElementById('createUserBtn')) {
        document.getElementById('createUserBtn').addEventListener('click', () => openUserModal());
    }
    
    if (document.getElementById('closeUserModal')) {
        document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
        document.getElementById('cancelUserBtn').addEventListener('click', closeUserModal);
        document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    }
    
    // Permission management
    if (document.getElementById('permissionUserId')) {
        document.getElementById('permissionUserId').addEventListener('change', loadUserPermissions);
    }
    
    if (document.getElementById('addPermissionBtn')) {
        document.getElementById('addPermissionBtn').addEventListener('click', openAddPermissionModal);
    }
    
    if (document.getElementById('closeAddPermissionModal')) {
        document.getElementById('closeAddPermissionModal').addEventListener('click', closeAddPermissionModal);
        document.getElementById('cancelAddPermissionBtn').addEventListener('click', closeAddPermissionModal);
        document.getElementById('savePermissionBtn').addEventListener('click', savePermission);
    }
}

// Switch view
function switchView(view) {
    currentView = view;
    
    // Hide all views
    document.querySelectorAll('.view-content').forEach(v => v.classList.add('hidden'));
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Show selected view
    const viewElement = document.getElementById(`${view}View`);
    if (viewElement) {
        viewElement.classList.remove('hidden');
    }
    
    // Add active class to current nav link
    const activeLink = document.querySelector(`.nav-link[data-view="${view}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load view data
    loadCurrentView();
}

// Load current view data
async function loadCurrentView() {
    switch (currentView) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'tasks':
            await loadMyTasks();
            break;
        case 'all-tasks':
            await loadAllTasks();
            break;
        case 'notifications':
            await loadNotifications();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'permissions':
               await loadPermissionsView();
               break;
           case 'stock':
               if (typeof initStock === 'function') {
                   await initStock();
               }
               break;
        case 'reports':
            await loadReportsView();
            break;
    }
}

// Load dashboard
async function loadDashboard() {
    try {
        // Load statistics
        const tasks = await apiRequest('/tasks');
        
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const overdue = tasks.filter(t => t.status === 'overdue').length;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('overdueTasks').textContent = overdue;
        
        // Update task badge
        const activeTasks = pending + overdue;
        const taskBadge = document.getElementById('taskBadge');
        if (activeTasks > 0) {
            taskBadge.textContent = activeTasks;
            taskBadge.classList.remove('hidden');
        } else {
            taskBadge.classList.add('hidden');
        }
        
        // Load recent tasks
        const recentTasks = tasks.slice(0, 5);
        renderTaskList(recentTasks, 'recentTasksList');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

// Load my tasks
async function loadMyTasks() {
    try {
        const tasks = await apiRequest('/tasks');
        
        // Apply filters
        const statusFilter = document.getElementById('filterStatus')?.value;
        const priorityFilter = document.getElementById('filterPriority')?.value;
        const categoryFilter = document.getElementById('filterCategory')?.value;
        
        let filteredTasks = tasks;
        
        if (statusFilter) {
            filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
        }
        if (priorityFilter) {
            filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
        }
        if (categoryFilter) {
            filteredTasks = filteredTasks.filter(t => t.category === categoryFilter);
        }
        
        renderTaskList(filteredTasks, 'myTasksList');
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Failed to load tasks', 'error');
    }
}

// Load all tasks (management only)
async function loadAllTasks() {
    try {
        const tasks = await apiRequest('/tasks');
        renderTaskList(tasks, 'allTasksList', true);
    } catch (error) {
        console.error('Error loading all tasks:', error);
        showToast('Failed to load tasks', 'error');
    }
}

// Render task list
function renderTaskList(tasks, containerId, showActions = false) {
    const container = document.getElementById(containerId);
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <h3 class="empty-state-title">No tasks found</h3>
                <p class="empty-state-message">There are no tasks to display.</p>
            </div>
        `;
        return;
    }
    
    // Check if user can edit/delete tasks
    const canEdit = ['admin', 'manager', 'supervisor'].includes(currentUser.role);
    const canDelete = ['admin', 'manager'].includes(currentUser.role);
    
    container.innerHTML = tasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <div class="task-content">
                <div class="task-header">
                    <div>
                        <h3 class="task-title">${escapeHtml(task.title)}</h3>
                        <div class="task-meta">
                            <span class="task-meta-item">
                                <i class="fas fa-tag"></i>
                                ${escapeHtml(task.category)}
                            </span>
                            <span class="badge priority-${task.priority.toLowerCase()}">
                                ${task.priority}
                            </span>
                            <span class="badge status-${task.status}">
                                ${task.status}
                            </span>
                            ${task.assignment_type === 'shift-based' ? 
                                `<span class="task-meta-item">
                                    <i class="fas fa-calendar"></i>
                                    Shift: ${task.assigned_date}
                                </span>` : 
                                task.assigned_to_name ? 
                                `<span class="task-meta-item">
                                    <i class="fas fa-user"></i>
                                    ${escapeHtml(task.assigned_to_name)}
                                </span>` : ''
                            }
                            ${task.due_date ? 
                                `<span class="task-meta-item">
                                    <i class="fas fa-clock"></i>
                                    Due: ${task.due_date}${task.due_time ? ' ' + task.due_time : ''}
                                </span>` : ''
                            }
                        </div>
                    </div>
                    <div class="task-actions">
                        ${task.status !== 'completed' && (['admin', 'manager', 'supervisor'].includes(currentUser.role) || task.assigned_to === currentUser.id || task.assignment_type === 'shift-based') ? 
                            `<button class="btn btn-success btn-sm complete-task-btn" data-task-id="${task.id}">
                                <i class="fas fa-check"></i>
                                Complete
                            </button>` : ''
                        }
                        ${showActions && canEdit ? 
                            `<button class="btn btn-secondary btn-sm edit-task-btn" data-task-id="${task.id}">
                                <i class="fas fa-edit"></i>
                            </button>` : ''
                        }
                        ${showActions && canDelete ? 
                            `<button class="btn btn-danger btn-sm delete-task-btn" data-task-id="${task.id}">
                                <i class="fas fa-trash"></i>
                            </button>` : ''
                        }
                    </div>
                </div>
                ${task.description ? 
                    `<p class="task-description">${escapeHtml(task.description)}</p>` : ''
                }
            </div>
        </div>
    `).join('');
    
    // Add event listeners
    container.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const taskId = item.dataset.taskId;
                showTaskDetails(taskId);
            }
        });
    });
    
    container.querySelectorAll('.complete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = btn.dataset.taskId;
            openCompleteTaskModal(taskId);
        });
    });
    
    if (showActions) {
        container.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.taskId;
                editTask(taskId);
            });
        });
        
        container.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.taskId;
                deleteTask(taskId);
            });
        });
    }
}

// Show task details
async function showTaskDetails(taskId) {
    try {
        const task = await apiRequest(`/tasks/${taskId}`);
        
        const content = document.getElementById('taskDetailsContent');
        content.innerHTML = `
            <div class="form-group">
                <label class="form-label">Title</label>
                <p>${escapeHtml(task.title)}</p>
            </div>
            
            ${task.description ? `
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <p>${escapeHtml(task.description)}</p>
                </div>
            ` : ''}
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <p>${escapeHtml(task.category)}</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <p><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <p><span class="badge status-${task.status}">${task.status}</span></p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assignment Type</label>
                    <p>${task.assignment_type === 'individual' ? 'Individual' : 'Shift-based'}</p>
                </div>
            </div>
            
            ${task.assignment_type === 'individual' && task.assigned_to_name ? `
                <div class="form-group">
                    <label class="form-label">Assigned To</label>
                    <p>${escapeHtml(task.assigned_to_name)}</p>
                </div>
            ` : ''}
            
            ${task.assignment_type === 'shift-based' && task.assigned_date ? `
                <div class="form-group">
                    <label class="form-label">Shift Date</label>
                    <p>${task.assigned_date}</p>
                </div>
            ` : ''}
            
            ${task.due_date ? `
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <p>${task.due_date}${task.due_time ? ' ' + task.due_time : ''}</p>
                </div>
            ` : ''}
            
            ${task.status === 'completed' ? `
                <div class="form-group">
                    <label class="form-label">Completed By</label>
                    <p>${escapeHtml(task.completed_by_name || 'Unknown')}</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Completed At</label>
                    <p>${task.completed_at}</p>
                </div>
                
                ${task.completion_notes ? `
                    <div class="form-group">
                        <label class="form-label">Completion Notes</label>
                        <p>${escapeHtml(task.completion_notes)}</p>
                    </div>
                ` : ''}
                
                ${task.completion_photo ? `
                    <div class="form-group">
                        <label class="form-label">Completion Photo</label>
                        <img src="${task.completion_photo}" alt="Completion photo" style="max-width: 100%; border-radius: 8px;">
                    </div>
                ` : ''}
            ` : ''}
            
            <div class="form-group">
                <label class="form-label">Created By</label>
                <p>${escapeHtml(task.created_by_name || 'Unknown')}</p>
            </div>
        `;
        
        // Show complete button if task is not completed and user can complete it
        const completeBtn = document.getElementById('completeTaskBtn');
        if (task.status !== 'completed' && 
            (currentUser.role === 'management' || 
             task.assigned_to === currentUser.id || 
             task.assignment_type === 'shift-based')) {
            completeBtn.style.display = 'inline-flex';
            completeBtn.onclick = () => {
                closeTaskDetailsModal();
                openCompleteTaskModal(taskId);
            };
        } else {
            completeBtn.style.display = 'none';
        }
        
        document.getElementById('taskDetailsModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading task details:', error);
        showToast('Failed to load task details', 'error');
    }
}

// Close task details modal
function closeTaskDetailsModal() {
    document.getElementById('taskDetailsModal').classList.add('hidden');
}

// Load notifications
async function loadNotifications() {
    try {
        const notifications = await apiRequest('/notifications');
        
        // Update notification badge
        const unreadCount = notifications.filter(n => !n.read).length;
        const notificationBadge = document.getElementById('notificationBadge');
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
        
        // Render notifications if on notifications view
        if (currentView === 'notifications') {
            renderNotifications(notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Render notifications
function renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <h3 class="empty-state-title">No notifications</h3>
                <p class="empty-state-message">You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notification => `
        <div class="task-item ${notification.read ? 'text-muted' : ''}" style="cursor: default;">
            <div class="task-content">
                <div class="task-header">
                    <div>
                        <p style="margin: 0;">${escapeHtml(notification.message)}</p>
                        <div class="task-meta">
                            <span class="task-meta-item">
                                <i class="fas fa-clock"></i>
                                ${new Date(notification.created_at).toLocaleString()}
                            </span>
                            ${!notification.read ? '<span class="badge badge-primary">New</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    try {
        await apiRequest('/notifications/read-all', { method: 'POST' });
        showToast('All notifications marked as read', 'success');
        loadNotifications();
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        showToast('Failed to mark notifications as read', 'error');
    }
}

// Load users (management only)
async function loadUsers() {
    try {
        const users = await apiRequest('/users');
        renderUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

// Render users
function renderUsers(users) {
    const container = document.getElementById('usersList');
    
    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3 class="empty-state-title">No users found</h3>
            </div>
        `;
        return;
    }
    
    const getRoleBadgeClass = (role) => {
        const classes = {
            'admin': 'badge-danger',
            'manager': 'badge-primary',
            'supervisor': 'badge-warning',
            'bar_staff': 'badge-info',
            'cleaner': 'badge-success',
            'employee': 'badge-info'
        };
        return classes[role] || 'badge-info';
    };
    
    container.innerHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${escapeHtml(user.full_name)}</td>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${escapeHtml(user.email || 'N/A')}</td>
                            <td><span class="badge ${getRoleBadgeClass(user.role)}">${getRoleDisplayName(user.role)}</span></td>
                            <td><span class="badge badge-${user.active ? 'success' : 'danger'}">${user.active ? 'Active' : 'Inactive'}</span></td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="openUserModal(${user.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Change password
async function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    try {
        await apiRequest('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        showToast('Password changed successfully', 'success');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        showToast(error.message || 'Failed to change password', 'error');
    }
}

// Export tasks to PDF
async function exportTasks() {
    try {
        showToast('Generating PDF report...', 'info');
        
        const response = await fetch(`${API_URL}/reports/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Open PDF in new tab
            window.open(data.path, '_blank');
            showToast('Report generated successfully', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error exporting tasks:', error);
        showToast('Failed to generate report', 'error');
    }
}

// User Management Functions
async function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    const passwordGroup = document.getElementById('passwordGroup');
    const customPermissionsGroup = document.getElementById('customPermissionsGroup');
    
    // Reset form
    form.reset();
    document.getElementById('userId').value = '';
    
    // Load available permissions for admin
    if (currentUser.role === 'admin') {
        try {
            const permissions = await apiRequest('/permissions/available');
            const checkboxContainer = document.getElementById('permissionCheckboxes');
            checkboxContainer.innerHTML = permissions.map(p => `
                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer;">
                    <input type="checkbox" name="permission" value="${p.permission}" class="permission-checkbox">
                    <span>${getPermissionDisplayName(p.permission)}</span>
                </label>
            `).join('');
            customPermissionsGroup.style.display = 'block';
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    } else {
        customPermissionsGroup.style.display = 'none';
    }
    
    if (userId) {
        // Edit mode
        modalTitle.textContent = 'Edit User';
        passwordGroup.style.display = 'none';
        document.getElementById('userPassword').required = false;
        
        // Load user data
        try {
            const user = await apiRequest(`/users/${userId}`);
            document.getElementById('userId').value = user.id;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userFullName').value = user.full_name;
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userPhone').value = user.phone || '';
            document.getElementById('userRole').value = user.role;
            
            // Load user's custom permissions
            if (currentUser.role === 'admin') {
                const permData = await apiRequest(`/permissions/user/${userId}`);
                const customPerms = permData.customPermissions.map(p => p.permission);
                
                // Check the boxes for custom permissions
                document.querySelectorAll('.permission-checkbox').forEach(checkbox => {
                    checkbox.checked = customPerms.includes(checkbox.value);
                });
            }
        } catch (error) {
            console.error('Error loading user:', error);
            showToast('Failed to load user', 'error');
        }
    } else {
        // Create mode
        modalTitle.textContent = 'Create User';
        passwordGroup.style.display = 'block';
        document.getElementById('userPassword').required = true;
    }
    
    modal.classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function saveUser() {
    const form = document.getElementById('userForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('userUsername').value,
        full_name: document.getElementById('userFullName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value
    };
    
    if (!userId) {
        userData.password = document.getElementById('userPassword').value;
    }
    
    // Get selected custom permissions (admin only)
    const selectedPermissions = [];
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.permission-checkbox:checked').forEach(checkbox => {
            selectedPermissions.push(checkbox.value);
        });
    }
    
    try {
        const saveBtn = document.getElementById('saveUserBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        let newUserId = userId;
        
        if (userId) {
            // Update existing user
            await apiRequest(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            // Update permissions if admin
            if (currentUser.role === 'admin') {
                // Get current custom permissions
                const permData = await apiRequest(`/permissions/user/${userId}`);
                const currentCustomPerms = permData.customPermissions.map(p => p.permission);
                
                // Revoke permissions that were unchecked
                const toRevoke = currentCustomPerms.filter(p => !selectedPermissions.includes(p));
                for (const perm of toRevoke) {
                    await apiRequest('/permissions/revoke', {
                        method: 'POST',
                        body: JSON.stringify({ userId: parseInt(userId), permission: perm })
                    });
                }
                
                // Grant new permissions
                const toGrant = selectedPermissions.filter(p => !currentCustomPerms.includes(p));
                for (const perm of toGrant) {
                    await apiRequest('/permissions/grant', {
                        method: 'POST',
                        body: JSON.stringify({ userId: parseInt(userId), permission: perm })
                    });
                }
            }
            
            showToast('User updated successfully', 'success');
        } else {
            // Create new user
            const result = await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            newUserId = result.userId;
            
            // Grant custom permissions if admin and permissions selected
            if (currentUser.role === 'admin' && selectedPermissions.length > 0) {
                await apiRequest('/permissions/bulk-grant', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        userId: newUserId, 
                        permissions: selectedPermissions 
                    })
                });
            }
            
            showToast('User created successfully', 'success');
        }
        
        closeUserModal();
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        showToast(error.message || 'Failed to save user', 'error');
    } finally {
        const saveBtn = document.getElementById('saveUserBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save User';
    }
}

// Permission Management Functions
async function loadPermissionsView() {
    try {
        // Load users for dropdown
        const users = await apiRequest('/users');
        const select = document.getElementById('permissionUserId');
        select.innerHTML = '<option value="">Select a user</option>' +
            users.map(user => `<option value="${user.id}">${escapeHtml(user.full_name)} (${user.role})</option>`).join('');
        
        // Load available permissions
        const permissions = await apiRequest('/permissions/available');
        window.availablePermissions = permissions;
    } catch (error) {
        console.error('Error loading permissions view:', error);
        showToast('Failed to load permissions', 'error');
    }
}

async function loadUserPermissions() {
    const userId = document.getElementById('permissionUserId').value;
    
    if (!userId) {
        document.getElementById('permissionsContent').style.display = 'none';
        return;
    }
    
    try {
        const data = await apiRequest(`/permissions/user/${userId}`);
        const user = await apiRequest(`/users/${userId}`);
        
        // Show permissions content
        document.getElementById('permissionsContent').style.display = 'block';
        
        // Get role permissions
        const rolePermissions = await apiRequest(`/permissions/role/${user.role}`);
        
        // Render role permissions
        const roleList = document.getElementById('rolePermissionsList');
        roleList.innerHTML = `
            <p class="text-muted mb-2">These permissions are granted by the user's role: <strong>${getRoleDisplayName(user.role)}</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${rolePermissions.map(perm => `
                    <span class="badge badge-info">${getPermissionDisplayName(perm)}</span>
                `).join('')}
            </div>
        `;
        
        // Render custom permissions
        const customList = document.getElementById('customPermissionsList');
        if (data.customPermissions.length === 0) {
            customList.innerHTML = '<p class="text-muted">No custom permissions assigned</p>';
        } else {
            customList.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${data.customPermissions.map(perm => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div>
                                <strong>${getPermissionDisplayName(perm.permission)}</strong>
                                <p class="text-muted" style="font-size: 0.875rem; margin: 0;">
                                    Granted by ${escapeHtml(perm.granted_by_name)} on ${new Date(perm.granted_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="revokePermission(${userId}, '${perm.permission}')">
                                <i class="fas fa-times"></i>
                                Revoke
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading user permissions:', error);
        showToast('Failed to load user permissions', 'error');
    }
}

function openAddPermissionModal() {
    const userId = document.getElementById('permissionUserId').value;
    
    if (!userId) {
        showToast('Please select a user first', 'warning');
        return;
    }
    
    // Populate permission dropdown
    const select = document.getElementById('permissionSelect');
    select.innerHTML = '<option value="">Select permission</option>' +
        window.availablePermissions.map(p => `<option value="${p.permission}">${getPermissionDisplayName(p.permission)}</option>`).join('');
    
    document.getElementById('addPermissionModal').classList.remove('hidden');
}

function closeAddPermissionModal() {
    document.getElementById('addPermissionModal').classList.add('hidden');
}

async function savePermission() {
    const userId = document.getElementById('permissionUserId').value;
    const permission = document.getElementById('permissionSelect').value;
    
    if (!permission) {
        showToast('Please select a permission', 'warning');
        return;
    }
    
    try {
        await apiRequest('/permissions/grant', {
            method: 'POST',
            body: JSON.stringify({ userId: parseInt(userId), permission })
        });
        
        showToast('Permission granted successfully', 'success');
        closeAddPermissionModal();
        loadUserPermissions();
    } catch (error) {
        console.error('Error granting permission:', error);
        showToast(error.message || 'Failed to grant permission', 'error');
    }
}

async function revokePermission(userId, permission) {
    if (!confirm(`Are you sure you want to revoke this permission?`)) {
        return;
    }
    
    try {
        await apiRequest('/permissions/revoke', {
            method: 'POST',
            body: JSON.stringify({ userId, permission })
        });
        
        showToast('Permission revoked successfully', 'success');
        loadUserPermissions();
    } catch (error) {
        console.error('Error revoking permission:', error);
        showToast(error.message || 'Failed to revoke permission', 'error');
    }
}

function getRoleDisplayName(role) {
    const roleNames = {
        'admin': 'Administrator',
        'manager': 'Manager',
        'supervisor': 'Supervisor',
        'bar_staff': 'Bar Staff',
        'cleaner': 'Cleaner',
        'employee': 'Employee'
    };
    return roleNames[role] || role;
}

function getPermissionDisplayName(permission) {
    return permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Report Management Functions
async function loadReportsView() {
    try {
        // Load users for dropdowns
        const users = await apiRequest('/users');
        
        // Populate user dropdowns
        const reportAssignedTo = document.getElementById('reportAssignedTo');
        const reportUserId = document.getElementById('reportUserId');
        
        if (reportAssignedTo) {
            reportAssignedTo.innerHTML = '<option value="">All</option>' +
                users.map(user => `<option value="${user.id}">${escapeHtml(user.full_name)}</option>`).join('');
        }
        
        if (reportUserId) {
            reportUserId.innerHTML = '<option value="">Select a user</option>' +
                users.map(user => `<option value="${user.id}">${escapeHtml(user.full_name)}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading reports view:', error);
    }
}

function handleReportTypeChange() {
    const reportType = document.getElementById('reportType').value;
    
    // Hide all options
    document.getElementById('taskReportOptions').style.display = 'none';
    document.getElementById('userReportOptions').style.display = 'none';
    document.getElementById('summaryReportOptions').style.display = 'none';
    
    // Show relevant options
    if (reportType === 'tasks') {
        document.getElementById('taskReportOptions').style.display = 'block';
    } else if (reportType === 'user') {
        document.getElementById('userReportOptions').style.display = 'block';
        document.getElementById('reportUserId').required = true;
    } else if (reportType === 'summary') {
        document.getElementById('summaryReportOptions').style.display = 'block';
    }
}

async function generateReport(e) {
    e.preventDefault();
    
    const reportType = document.getElementById('reportType').value;
    
    if (!reportType) {
        showToast('Please select a report type', 'warning');
        return;
    }
    
    try {
        showToast('Generating report...', 'info');
        
        if (reportType === 'tasks') {
            await generateTaskReport();
        } else if (reportType === 'user') {
            await generateUserReport();
        } else if (reportType === 'summary') {
            await generateSummaryReport();
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Failed to generate report', 'error');
    }
}

async function generateTaskReport() {
    const filters = {
        status: document.getElementById('reportStatus').value,
        priority: document.getElementById('reportPriority').value,
        category: document.getElementById('reportCategory').value,
        assignedTo: document.getElementById('reportAssignedTo').value,
        dateFrom: document.getElementById('reportDateFrom').value,
        dateTo: document.getElementById('reportDateTo').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    const response = await fetch(`${API_URL}/reports/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ filters })
    });
    
    const data = await response.json();
    
    if (response.ok) {
        window.open(data.path, '_blank');
        showToast('Report generated successfully', 'success');
    } else {
        throw new Error(data.error);
    }
}

async function generateUserReport() {
    const userId = document.getElementById('reportUserId').value;
    
    if (!userId) {
        showToast('Please select a user', 'warning');
        return;
    }
    
    const dateFrom = document.getElementById('userReportDateFrom').value;
    const dateTo = document.getElementById('userReportDateTo').value;
    
    let url = `${API_URL}/reports/user/${userId}`;
    if (dateFrom || dateTo) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        url += '?' + params.toString();
    }
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    });
    
    const data = await response.json();
    
    if (response.ok) {
        window.open(data.path, '_blank');
        showToast('Report generated successfully', 'success');
    } else {
        throw new Error(data.error);
    }
}

async function generateSummaryReport() {
    const filters = {
        dateFrom: document.getElementById('summaryReportDateFrom').value,
        dateTo: document.getElementById('summaryReportDateTo').value,
        includeUserStats: document.getElementById('includeUserStats').checked,
        includeCategoryBreakdown: document.getElementById('includeCategoryBreakdown').checked
    };
    
    const response = await fetch(`${API_URL}/reports/summary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(filters)
    });
    
    const data = await response.json();
    
    if (response.ok) {
        window.open(data.path, '_blank');
        showToast('Report generated successfully', 'success');
    } else {
        throw new Error(data.error);
    }
}

// Theme Management Functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme, false);
}

function setTheme(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (save) {
        localStorage.setItem('theme', theme);
        showToast(`${theme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
    }
    
    // Update button states
    const lightBtn = document.getElementById('lightModeBtn');
    const darkBtn = document.getElementById('darkModeBtn');
    
    if (lightBtn && darkBtn) {
        if (theme === 'light') {
            lightBtn.classList.remove('btn-secondary');
            lightBtn.classList.add('btn-primary');
            darkBtn.classList.remove('btn-primary');
            darkBtn.classList.add('btn-secondary');
        } else {
            darkBtn.classList.remove('btn-secondary');
            darkBtn.classList.add('btn-primary');
            lightBtn.classList.remove('btn-primary');
            lightBtn.classList.add('btn-secondary');
        }
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}