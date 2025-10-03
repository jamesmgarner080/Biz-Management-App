const express = require('express');
const { authenticateToken, requireAdmin } = require('../auth');

function createPermissionRoutes(db) {
    const router = express.Router();
    
    // Get all available permissions
    router.get('/available', authenticateToken, requireAdmin, (req, res) => {
        try {
            const permissions = db.getAllPermissions();
            res.json(permissions);
        } catch (error) {
            console.error('Get permissions error:', error);
            res.status(500).json({ error: 'Failed to get permissions' });
        }
    });
    
    // Get user's permissions
    router.get('/user/:userId', authenticateToken, (req, res) => {
        try {
            const { userId } = req.params;
            
            // Users can only view their own permissions unless they're admin
            if (req.user.role !== 'admin' && parseInt(userId) !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const permissions = db.getUserPermissions(userId);
            const customPermissions = db.getUserCustomPermissions(userId);
            
            res.json({
                permissions,
                customPermissions
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({ error: 'Failed to get user permissions' });
        }
    });
    
    // Get role permissions
    router.get('/role/:role', authenticateToken, requireAdmin, (req, res) => {
        try {
            const { role } = req.params;
            const permissions = db.getRolePermissions(role);
            res.json(permissions);
        } catch (error) {
            console.error('Get role permissions error:', error);
            res.status(500).json({ error: 'Failed to get role permissions' });
        }
    });
    
    // Grant permission to user
    router.post('/grant', authenticateToken, requireAdmin, (req, res) => {
        try {
            const { userId, permission } = req.body;
            
            if (!userId || !permission) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            db.grantPermission(userId, permission, req.user.id);
            
            // Log action
            db.logAction(req.user.id, 'grant_permission', 'permission', userId, 
                `Granted permission: ${permission}`, req.ip);
            
            res.json({ message: 'Permission granted successfully' });
        } catch (error) {
            console.error('Grant permission error:', error);
            res.status(500).json({ error: 'Failed to grant permission' });
        }
    });
    
    // Revoke permission from user
    router.post('/revoke', authenticateToken, requireAdmin, (req, res) => {
        try {
            const { userId, permission } = req.body;
            
            if (!userId || !permission) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            db.revokePermission(userId, permission);
            
            // Log action
            db.logAction(req.user.id, 'revoke_permission', 'permission', userId, 
                `Revoked permission: ${permission}`, req.ip);
            
            res.json({ message: 'Permission revoked successfully' });
        } catch (error) {
            console.error('Revoke permission error:', error);
            res.status(500).json({ error: 'Failed to revoke permission' });
        }
    });
    
    // Bulk grant permissions
    router.post('/bulk-grant', authenticateToken, requireAdmin, (req, res) => {
        try {
            const { userId, permissions } = req.body;
            
            if (!userId || !permissions || !Array.isArray(permissions)) {
                return res.status(400).json({ error: 'Invalid request' });
            }
            
            permissions.forEach(permission => {
                db.grantPermission(userId, permission, req.user.id);
            });
            
            // Log action
            db.logAction(req.user.id, 'bulk_grant_permissions', 'permission', userId, 
                `Granted ${permissions.length} permissions`, req.ip);
            
            res.json({ message: 'Permissions granted successfully' });
        } catch (error) {
            console.error('Bulk grant permissions error:', error);
            res.status(500).json({ error: 'Failed to grant permissions' });
        }
    });
    
    // Bulk revoke permissions
    router.post('/bulk-revoke', authenticateToken, requireAdmin, (req, res) => {
        try {
            const { userId, permissions } = req.body;
            
            if (!userId || !permissions || !Array.isArray(permissions)) {
                return res.status(400).json({ error: 'Invalid request' });
            }
            
            permissions.forEach(permission => {
                db.revokePermission(userId, permission);
            });
            
            // Log action
            db.logAction(req.user.id, 'bulk_revoke_permissions', 'permission', userId, 
                `Revoked ${permissions.length} permissions`, req.ip);
            
            res.json({ message: 'Permissions revoked successfully' });
        } catch (error) {
            console.error('Bulk revoke permissions error:', error);
            res.status(500).json({ error: 'Failed to revoke permissions' });
        }
    });
    
    return router;
}

module.exports = createPermissionRoutes;