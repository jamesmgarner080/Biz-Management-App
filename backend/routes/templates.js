const express = require('express');
const { authenticateToken, requireManagement } = require('../auth');

function createTemplateRoutes(db) {
    const router = express.Router();
    
    // Get all task templates
    router.get('/', authenticateToken, (req, res) => {
        try {
            const templates = db.getAllTaskTemplates();
            res.json(templates);
        } catch (error) {
            console.error('Get templates error:', error);
            res.status(500).json({ error: 'Failed to get templates' });
        }
    });
    
    // Get template by ID
    router.get('/:id', authenticateToken, (req, res) => {
        try {
            const template = db.getTaskTemplateById(req.params.id);
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            res.json(template);
        } catch (error) {
            console.error('Get template error:', error);
            res.status(500).json({ error: 'Failed to get template' });
        }
    });
    
    // Create task template (management only)
    router.post('/', authenticateToken, requireManagement, (req, res) => {
        try {
            const { name, description, category, priority, estimated_duration, recurrence_pattern } = req.body;
            
            if (!name || !category || !priority) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const result = db.createTaskTemplate({
                name,
                description,
                category,
                priority,
                estimated_duration,
                recurrence_pattern,
                created_by: req.user.id
            });
            
            // Log action
            db.logAction(req.user.id, 'create_template', 'template', result.lastInsertRowid, 
                `Created task template: ${name}`, req.ip);
            
            res.status(201).json({
                message: 'Task template created successfully',
                templateId: result.lastInsertRowid
            });
        } catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({ error: 'Failed to create template' });
        }
    });
    
    // Delete task template (management only)
    router.delete('/:id', authenticateToken, requireManagement, (req, res) => {
        try {
            const { id } = req.params;
            const template = db.getTaskTemplateById(id);
            
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            
            db.deleteTaskTemplate(id);
            
            // Log action
            db.logAction(req.user.id, 'delete_template', 'template', id, 
                `Deleted task template: ${template.name}`, req.ip);
            
            res.json({ message: 'Task template deleted successfully' });
        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({ error: 'Failed to delete template' });
        }
    });
    
    return router;
}

module.exports = createTemplateRoutes;