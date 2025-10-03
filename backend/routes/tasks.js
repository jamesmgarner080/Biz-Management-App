const express = require('express');
const { authenticateToken, requireManagement } = require('../auth');

function createTaskRoutes(db, io) {
    const router = express.Router();
    
    // Get all tasks
    router.get('/', authenticateToken, (req, res) => {
        try {
            let tasks;
            
            if (req.user.role === 'management') {
                // Management sees all tasks
                tasks = db.getAllTasks();
            } else {
                // Employees see only their assigned tasks and shift-based tasks
                tasks = db.getTasksByUser(req.user.id);
            }
            
            res.json(tasks);
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ error: 'Failed to get tasks' });
        }
    });
    
    // Get task by ID
    router.get('/:id', authenticateToken, (req, res) => {
        try {
            const task = db.getTaskById(req.params.id);
            
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            // Check permissions
            if (req.user.role !== 'management' && 
                task.assigned_to !== req.user.id && 
                task.assignment_type !== 'shift-based') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            res.json(task);
        } catch (error) {
            console.error('Get task error:', error);
            res.status(500).json({ error: 'Failed to get task' });
        }
    });
    
    // Get tasks by date
    router.get('/date/:date', authenticateToken, (req, res) => {
        try {
            const tasks = db.getTasksByDate(req.params.date);
            res.json(tasks);
        } catch (error) {
            console.error('Get tasks by date error:', error);
            res.status(500).json({ error: 'Failed to get tasks' });
        }
    });
    
    // Get shift tasks for a specific date
    router.get('/shift/:date', authenticateToken, (req, res) => {
        try {
            const tasks = db.getShiftTasksForDate(req.params.date);
            res.json(tasks);
        } catch (error) {
            console.error('Get shift tasks error:', error);
            res.status(500).json({ error: 'Failed to get shift tasks' });
        }
    });
    
    // Create new task (management only or with permission)
    router.post('/', authenticateToken, (req, res) => {
        const db = req.app.get('db');
        
        // Check if user has permission
        if (!['admin', 'manager', 'supervisor'].includes(req.user.role) && 
            !db.hasPermission(req.user.id, 'create_tasks')) {
            return res.status(403).json({ error: 'Permission required: create_tasks' });
        }
        
        try {
            const {
                title,
                description,
                category,
                priority,
                assignment_type,
                assigned_to,
                assigned_date,
                due_date,
                due_time,
                recurrence
            } = req.body;
            
            // Validation
            if (!title || !category || !priority || !assignment_type) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            if (assignment_type === 'individual' && !assigned_to) {
                return res.status(400).json({ error: 'Individual tasks must have an assigned user' });
            }
            
            if (assignment_type === 'shift-based' && !assigned_date) {
                return res.status(400).json({ error: 'Shift-based tasks must have an assigned date' });
            }
            
            // Create task
            const result = db.createTask({
                title,
                description,
                category,
                priority,
                assignment_type,
                assigned_to: assignment_type === 'individual' ? assigned_to : null,
                assigned_date: assignment_type === 'shift-based' ? assigned_date : null,
                due_date,
                due_time,
                recurrence,
                created_by: req.user.id
            });
            
            const taskId = result.lastInsertRowid;
            
            // Create notifications
            if (assignment_type === 'individual') {
                // Notify specific user
                db.createNotification(
                    assigned_to,
                    taskId,
                    `New task assigned: ${title}`,
                    'task_assigned'
                );
                
                // Emit socket event
                io.to(`user_${assigned_to}`).emit('new_task', {
                    taskId,
                    title,
                    priority
                });
            } else {
                // Notify all users on shift for that date
                const usersOnShift = db.getUsersOnShift(assigned_date);
                usersOnShift.forEach(user => {
                    db.createNotification(
                        user.id,
                        taskId,
                        `New shift duty for ${assigned_date}: ${title}`,
                        'shift_duty'
                    );
                    
                    io.to(`user_${user.id}`).emit('new_shift_duty', {
                        taskId,
                        title,
                        date: assigned_date,
                        priority
                    });
                });
            }
            
            // Log action
            db.logAction(req.user.id, 'create_task', 'task', taskId, 
                `Created task: ${title}`, req.ip);
            
            res.status(201).json({
                message: 'Task created successfully',
                taskId
            });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    });
    
    // Update task (management only or with permission)
    router.put('/:id', authenticateToken, (req, res) => {
        const db = req.app.get('db');
        
        // Check if user has permission
        if (!['admin', 'manager', 'supervisor'].includes(req.user.role) && 
            !db.hasPermission(req.user.id, 'edit_tasks')) {
            return res.status(403).json({ error: 'Permission required: edit_tasks' });
        }
        
        try {
            const { id } = req.params;
            const {
                title,
                description,
                category,
                priority,
                assignment_type,
                assigned_to,
                assigned_date,
                due_date,
                due_time,
                recurrence
            } = req.body;
            
            // Validation
            if (!title || !category || !priority || !assignment_type) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Update task
            db.updateTask(id, {
                title,
                description,
                category,
                priority,
                assignment_type,
                assigned_to: assignment_type === 'individual' ? assigned_to : null,
                assigned_date: assignment_type === 'shift-based' ? assigned_date : null,
                due_date,
                due_time,
                recurrence
            });
            
            // Log action
            db.logAction(req.user.id, 'update_task', 'task', id, 
                `Updated task: ${title}`, req.ip);
            
            // Emit socket event
            io.emit('task_updated', { taskId: id });
            
            res.json({ message: 'Task updated successfully' });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    });
    
    // Complete task
    router.post('/:id/complete', authenticateToken, (req, res) => {
        try {
            const { id } = req.params;
            const { notes, photo } = req.body;
            
            const task = db.getTaskById(id);
            
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            // Check if user can complete this task
            if (task.assignment_type === 'individual' && task.assigned_to !== req.user.id) {
                if (req.user.role !== 'management') {
                    return res.status(403).json({ error: 'You cannot complete this task' });
                }
            }
            
            // Complete task
            db.completeTask(id, req.user.id, notes, photo);
            
            // Create notification for task creator
            db.createNotification(
                task.created_by,
                id,
                `Task completed by ${req.user.full_name}: ${task.title}`,
                'task_completed'
            );
            
            // Emit socket event
            io.to(`user_${task.created_by}`).emit('task_completed', {
                taskId: id,
                completedBy: req.user.full_name,
                title: task.title
            });
            
            // Log action
            db.logAction(req.user.id, 'complete_task', 'task', id, 
                `Completed task: ${task.title}`, req.ip);
            
            res.json({ message: 'Task completed successfully' });
        } catch (error) {
            console.error('Complete task error:', error);
            res.status(500).json({ error: 'Failed to complete task' });
        }
    });
    
    // Update task status
    router.patch('/:id/status', authenticateToken, (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!['pending', 'in-progress', 'completed', 'overdue'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            
            db.updateTaskStatus(id, status);
            
            // Emit socket event
            io.emit('task_status_updated', { taskId: id, status });
            
            res.json({ message: 'Task status updated successfully' });
        } catch (error) {
            console.error('Update task status error:', error);
            res.status(500).json({ error: 'Failed to update task status' });
        }
    });
    
    // Delete task (management only or with permission)
    router.delete('/:id', authenticateToken, (req, res) => {
        const db = req.app.get('db');
        
        // Check if user has permission
        if (!['admin', 'manager'].includes(req.user.role) && 
            !db.hasPermission(req.user.id, 'delete_tasks')) {
            return res.status(403).json({ error: 'Permission required: delete_tasks' });
        }
        
        try {
            const { id } = req.params;
            const task = db.getTaskById(id);
            
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            db.deleteTask(id);
            
            // Log action
            db.logAction(req.user.id, 'delete_task', 'task', id, 
                `Deleted task: ${task.title}`, req.ip);
            
            // Emit socket event
            io.emit('task_deleted', { taskId: id });
            
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    });
    
    // Get task statistics (management only)
    router.get('/stats/overview', authenticateToken, requireManagement, (req, res) => {
        try {
            const stats = db.getTaskStatistics();
            res.json(stats);
        } catch (error) {
            console.error('Get task statistics error:', error);
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    });
    
    return router;
}

module.exports = createTaskRoutes;