// Task management functionality

// Open task modal
async function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    const form = document.getElementById('taskForm');
    
    // Reset form
    form.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('assignedToGroup').style.display = 'none';
    document.getElementById('assignedDateGroup').style.display = 'none';
    
    // Load active users for assignment dropdown
    try {
        const users = await apiRequest('/users/active');
        const assignedToSelect = document.getElementById('taskAssignedTo');
        assignedToSelect.innerHTML = '<option value="">Select user</option>' +
            users.map(user => `<option value="${user.id}">${escapeHtml(user.full_name)}</option>`).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
    
    if (taskId) {
        // Edit mode
        modalTitle.textContent = 'Edit Task';
        try {
            const task = await apiRequest(`/tasks/${taskId}`);
            
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskAssignmentType').value = task.assignment_type;
            
            if (task.assignment_type === 'individual') {
                document.getElementById('assignedToGroup').style.display = 'block';
                document.getElementById('taskAssignedTo').value = task.assigned_to;
                document.getElementById('taskAssignedTo').required = true;
            } else if (task.assignment_type === 'shift-based') {
                document.getElementById('assignedDateGroup').style.display = 'block';
                document.getElementById('taskAssignedDate').value = task.assigned_date;
                document.getElementById('taskAssignedDate').required = true;
            }
            
            document.getElementById('taskDueDate').value = task.due_date || '';
            document.getElementById('taskDueTime').value = task.due_time || '';
            document.getElementById('taskRecurrence').value = task.recurrence || 'none';
        } catch (error) {
            console.error('Error loading task:', error);
            showToast('Failed to load task', 'error');
            return;
        }
    } else {
        // Create mode
        modalTitle.textContent = 'Create Task';
    }
    
    modal.classList.remove('hidden');
}

// Close task modal
function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

// Save task
async function saveTask() {
    const form = document.getElementById('taskForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const taskId = document.getElementById('taskId').value;
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        assignment_type: document.getElementById('taskAssignmentType').value,
        assigned_to: document.getElementById('taskAssignedTo').value || null,
        assigned_date: document.getElementById('taskAssignedDate').value || null,
        due_date: document.getElementById('taskDueDate').value || null,
        due_time: document.getElementById('taskDueTime').value || null,
        recurrence: document.getElementById('taskRecurrence').value || 'none'
    };
    
    try {
        const saveBtn = document.getElementById('saveTaskBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        if (taskId) {
            // Update existing task
            await apiRequest(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });
            showToast('Task updated successfully', 'success');
        } else {
            // Create new task
            await apiRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            showToast('Task created successfully', 'success');
        }
        
        closeTaskModal();
        loadCurrentView();
    } catch (error) {
        console.error('Error saving task:', error);
        showToast(error.message || 'Failed to save task', 'error');
    } finally {
        const saveBtn = document.getElementById('saveTaskBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Task';
    }
}

// Edit task
async function editTask(taskId) {
    await openTaskModal(taskId);
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
        showToast('Task deleted successfully', 'success');
        loadCurrentView();
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
    }
}

// Open complete task modal
function openCompleteTaskModal(taskId) {
    document.getElementById('completeTaskId').value = taskId;
    document.getElementById('completionNotes').value = '';
    document.getElementById('completionPhoto').value = '';
    document.getElementById('completeTaskModal').classList.remove('hidden');
}

// Close complete task modal
function closeCompleteTaskModal() {
    document.getElementById('completeTaskModal').classList.add('hidden');
}

// Submit complete task
async function submitCompleteTask() {
    const taskId = document.getElementById('completeTaskId').value;
    const notes = document.getElementById('completionNotes').value;
    const photoInput = document.getElementById('completionPhoto');
    
    try {
        const submitBtn = document.getElementById('submitCompleteBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Completing...';
        
        let photoPath = null;
        
        // Upload photo if provided
        if (photoInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', photoInput.files[0]);
            
            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: formData
            });
            
            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                photoPath = uploadData.path;
            }
        }
        
        // Complete task
        await apiRequest(`/tasks/${taskId}/complete`, {
            method: 'POST',
            body: JSON.stringify({
                notes: notes,
                photo: photoPath
            })
        });
        
        showToast('Task completed successfully', 'success');
        closeCompleteTaskModal();
        loadCurrentView();
    } catch (error) {
        console.error('Error completing task:', error);
        showToast(error.message || 'Failed to complete task', 'error');
    } finally {
        const submitBtn = document.getElementById('submitCompleteBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Complete Task';
    }
}