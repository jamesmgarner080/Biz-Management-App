const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken, requireManagement, generateToken } = require('../auth');

function createUserRoutes(db) {
    const router = express.Router();
    
    // Login endpoint
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }
            
            const user = db.getUserByUsername(username);
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            if (!user.active) {
                return res.status(403).json({ error: 'Account is inactive' });
            }
            
            const validPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Update last login
            db.updateLastLogin(user.id);
            
            // Generate token
            const token = generateToken(user);
            
            // Log action
            db.logAction(user.id, 'login', 'user', user.id, 'User logged in', req.ip);
            
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    full_name: user.full_name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    });
    
    // Get current user info
    router.get('/me', authenticateToken, (req, res) => {
        try {
            const user = db.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user info' });
        }
    });
    
    // Get all users (management only)
    router.get('/', authenticateToken, requireManagement, (req, res) => {
        try {
            const users = db.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    });
    
    // Get user by ID
    router.get('/:id', authenticateToken, (req, res) => {
        try {
            const { id } = req.params;
            
            // Users can only view their own info unless they're management
            if (!['admin', 'manager'].includes(req.user.role) && parseInt(id) !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const user = db.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    });
    
    // Get active users (for assignment dropdowns)
    router.get('/active', authenticateToken, (req, res) => {
        try {
            const users = db.getActiveUsers();
            res.json(users);
        } catch (error) {
            console.error('Get active users error:', error);
            res.status(500).json({ error: 'Failed to get active users' });
        }
    });
    
    // Create new user (management only)
    router.post('/', authenticateToken, requireManagement, async (req, res) => {
        try {
            const { username, password, role, full_name, email, phone } = req.body;
            
            // Validation
            if (!username || !password || !role || !full_name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const validRoles = ['admin', 'manager', 'supervisor', 'bar_staff', 'cleaner', 'employee'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            
            // Check if username already exists
            const existingUser = db.getUserByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            
            // Hash password
            const password_hash = await bcrypt.hash(password, 10);
            
            // Create user
            const result = db.createUser({
                username,
                password_hash,
                role,
                full_name,
                email,
                phone
            });
            
            // Log action
            db.logAction(req.user.id, 'create_user', 'user', result.lastInsertRowid, 
                `Created user: ${username}`, req.ip);
            
            res.status(201).json({
                message: 'User created successfully',
                userId: result.lastInsertRowid
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    });
    
    // Update user (management only)
    router.put('/:id', authenticateToken, requireManagement, (req, res) => {
        try {
            const { id } = req.params;
            const { full_name, email, phone, role } = req.body;
            
            if (!full_name || !role) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            db.updateUser(id, { full_name, email, phone, role });
            
            // Log action
            db.logAction(req.user.id, 'update_user', 'user', id, 
                `Updated user: ${full_name}`, req.ip);
            
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    });
    
    // Change password
    router.post('/change-password', authenticateToken, async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current and new password required' });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            
            // Get user
            const user = db.getUserByUsername(req.user.username);
            
            // Verify current password
            const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            
            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            
            // Update password
            db.updateUserPassword(req.user.id, newPasswordHash);
            
            // Log action
            db.logAction(req.user.id, 'change_password', 'user', req.user.id, 
                'Password changed', req.ip);
            
            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    });
    
    return router;
}

module.exports = createUserRoutes;