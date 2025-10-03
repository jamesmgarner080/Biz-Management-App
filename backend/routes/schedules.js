const express = require('express');
const { authenticateToken, requireManagement } = require('../auth');

function createScheduleRoutes(db, io) {
    const router = express.Router();
    
    // Get schedules by date
    router.get('/date/:date', authenticateToken, (req, res) => {
        try {
            const schedules = db.getShiftSchedulesByDate(req.params.date);
            res.json(schedules);
        } catch (error) {
            console.error('Get schedules by date error:', error);
            res.status(500).json({ error: 'Failed to get schedules' });
        }
    });
    
    // Get user schedules
    router.get('/user/:userId', authenticateToken, (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;
            
            // Users can only view their own schedules unless they're management
            if (req.user.role !== 'management' && parseInt(userId) !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const schedules = db.getShiftSchedulesByUser(userId, startDate, endDate);
            res.json(schedules);
        } catch (error) {
            console.error('Get user schedules error:', error);
            res.status(500).json({ error: 'Failed to get schedules' });
        }
    });
    
    // Get users on shift for a specific date
    router.get('/on-duty/:date', authenticateToken, (req, res) => {
        try {
            const users = db.getUsersOnShift(req.params.date);
            res.json(users);
        } catch (error) {
            console.error('Get users on shift error:', error);
            res.status(500).json({ error: 'Failed to get users on shift' });
        }
    });
    
    // Create shift schedule (management only)
    router.post('/', authenticateToken, requireManagement, (req, res) => {
        try {
            const { user_id, shift_date, shift_start, shift_end, role, notes } = req.body;
            
            if (!user_id || !shift_date || !shift_start || !shift_end) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const result = db.createShiftSchedule({
                user_id,
                shift_date,
                shift_start,
                shift_end,
                role,
                notes
            });
            
            // Notify user about their shift
            db.createNotification(
                user_id,
                null,
                `You have been scheduled for a shift on ${shift_date} from ${shift_start} to ${shift_end}`,
                'system'
            );
            
            // Emit socket event
            io.to(`user_${user_id}`).emit('shift_scheduled', {
                date: shift_date,
                start: shift_start,
                end: shift_end
            });
            
            // Log action
            db.logAction(req.user.id, 'create_schedule', 'schedule', result.lastInsertRowid, 
                `Created shift schedule for user ${user_id}`, req.ip);
            
            res.status(201).json({
                message: 'Shift schedule created successfully',
                scheduleId: result.lastInsertRowid
            });
        } catch (error) {
            console.error('Create schedule error:', error);
            res.status(500).json({ error: 'Failed to create schedule' });
        }
    });
    
    return router;
}

module.exports = createScheduleRoutes;