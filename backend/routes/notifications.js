const express = require('express');
const { authenticateToken } = require('../auth');

function createNotificationRoutes(db, io) {
    const router = express.Router();
    
    // Get user notifications
    router.get('/', authenticateToken, (req, res) => {
        try {
            const unreadOnly = req.query.unread === 'true';
            const notifications = db.getUserNotifications(req.user.id, unreadOnly);
            res.json(notifications);
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ error: 'Failed to get notifications' });
        }
    });
    
    // Mark notification as read
    router.patch('/:id/read', authenticateToken, (req, res) => {
        try {
            db.markNotificationRead(req.params.id);
            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            console.error('Mark notification read error:', error);
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    });
    
    // Mark all notifications as read
    router.post('/read-all', authenticateToken, (req, res) => {
        try {
            db.markAllNotificationsRead(req.user.id);
            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            console.error('Mark all notifications read error:', error);
            res.status(500).json({ error: 'Failed to mark all notifications as read' });
        }
    });
    
    return router;
}

module.exports = createNotificationRoutes;