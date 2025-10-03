const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

class DatabaseManager {
    constructor() {
        const dbPath = process.env.DATABASE_PATH || './database/business_management.db';
        const dbDir = path.dirname(dbPath);
        
        // Create database directory if it doesn't exist
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        
        this.initializeDatabase();
    }
    
    initializeDatabase() {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const permissionsPath = path.join(__dirname, '../database/add_permissions.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            statements.forEach(statement => {
                try {
                    this.db.exec(statement);
                } catch (error) {
                    console.error('Error executing statement:', error.message);
                }
            });
            
            console.log('Database initialized successfully');
            
            // Initialize permissions
            if (fs.existsSync(permissionsPath)) {
                const permissionsSchema = fs.readFileSync(permissionsPath, 'utf8');
                const permStatements = permissionsSchema.split(';').filter(stmt => stmt.trim());
                
                permStatements.forEach(statement => {
                    try {
                        this.db.exec(statement);
                    } catch (error) {
                        console.error('Error executing permissions statement:', error.message);
                    }
                });
                
                console.log('Permissions initialized successfully');
            }
            
            this.createDefaultAdmin();
        } else {
            console.error('Schema file not found');
        }
    }
    
    async createDefaultAdmin() {
        try {
            const existingAdmin = this.db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
            
            if (!existingAdmin) {
                const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
                const passwordHash = await bcrypt.hash(password, 10);
                
                this.db.prepare(`
                    INSERT INTO users (username, password_hash, role, full_name, email)
                    VALUES (?, ?, ?, ?, ?)
                `).run('admin', passwordHash, 'admin', 'System Administrator', 'admin@example.com');
                
                console.log('Default admin user created');
                console.log('Username: admin');
                console.log('Password: admin123');
                console.log('PLEASE CHANGE THE PASSWORD IMMEDIATELY!');
            } else {
                // Update existing admin to new role if needed
                this.db.prepare('UPDATE users SET role = ? WHERE username = ? AND role = ?')
                    .run('admin', 'admin', 'management');
            }
        } catch (error) {
            console.error('Error creating default admin:', error.message);
        }
    }
    
    // User operations
    getUserByUsername(username) {
        return this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    }
    
    getUserById(id) {
        return this.db.prepare('SELECT id, username, role, full_name, email, phone, active FROM users WHERE id = ?').get(id);
    }
    
    getAllUsers() {
        return this.db.prepare('SELECT id, username, role, full_name, email, phone, active, created_at FROM users ORDER BY full_name').all();
    }
    
    getActiveUsers() {
        return this.db.prepare('SELECT id, username, role, full_name, email FROM users WHERE active = 1 ORDER BY full_name').all();
    }
    
    createUser(userData) {
        const stmt = this.db.prepare(`
            INSERT INTO users (username, password_hash, role, full_name, email, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            userData.username,
            userData.password_hash,
            userData.role,
            userData.full_name,
            userData.email,
            userData.phone
        );
    }
    
    updateUser(id, userData) {
        const stmt = this.db.prepare(`
            UPDATE users 
            SET full_name = ?, email = ?, phone = ?, role = ?
            WHERE id = ?
        `);
        return stmt.run(userData.full_name, userData.email, userData.phone, userData.role, id);
    }
    
    updateUserPassword(id, passwordHash) {
        return this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
    }
    
    updateLastLogin(id) {
        return this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    }
    
    // Task operations
    createTask(taskData) {
        const stmt = this.db.prepare(`
            INSERT INTO tasks (
                title, description, category, priority, assignment_type,
                assigned_to, assigned_date, due_date, due_time, recurrence, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            taskData.title,
            taskData.description,
            taskData.category,
            taskData.priority,
            taskData.assignment_type,
            taskData.assigned_to || null,
            taskData.assigned_date || null,
            taskData.due_date,
            taskData.due_time,
            taskData.recurrence || 'none',
            taskData.created_by
        );
    }
    
    getTaskById(id) {
        return this.db.prepare(`
            SELECT t.*, 
                   u1.full_name as assigned_to_name,
                   u2.full_name as created_by_name,
                   u3.full_name as completed_by_name
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            LEFT JOIN users u3 ON t.completed_by = u3.id
            WHERE t.id = ?
        `).get(id);
    }
    
    getAllTasks() {
        return this.db.prepare(`
            SELECT t.*, 
                   u1.full_name as assigned_to_name,
                   u2.full_name as created_by_name
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            ORDER BY t.due_date DESC, t.priority DESC
        `).all();
    }
    
    getTasksByUser(userId) {
        return this.db.prepare(`
            SELECT t.*, 
                   u1.full_name as created_by_name
            FROM tasks t
            LEFT JOIN users u1 ON t.created_by = u1.id
            WHERE t.assigned_to = ? OR (
                t.assignment_type = 'shift-based' AND 
                t.assigned_date IN (
                    SELECT shift_date FROM shift_schedules WHERE user_id = ?
                )
            )
            ORDER BY t.due_date DESC, t.priority DESC
        `).all(userId, userId);
    }
    
    getTasksByDate(date) {
        return this.db.prepare(`
            SELECT t.*, 
                   u1.full_name as assigned_to_name,
                   u2.full_name as created_by_name
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            WHERE DATE(t.assigned_date) = DATE(?) OR DATE(t.due_date) = DATE(?)
            ORDER BY t.priority DESC
        `).all(date, date);
    }
    
    getShiftTasksForDate(date) {
        return this.db.prepare(`
            SELECT t.*, u.full_name as created_by_name
            FROM tasks t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.assignment_type = 'shift-based' 
            AND DATE(t.assigned_date) = DATE(?)
            AND t.status != 'completed'
            ORDER BY t.priority DESC
        `).all(date);
    }
    
    updateTask(id, taskData) {
        const stmt = this.db.prepare(`
            UPDATE tasks 
            SET title = ?, description = ?, category = ?, priority = ?,
                assignment_type = ?, assigned_to = ?, assigned_date = ?,
                due_date = ?, due_time = ?, recurrence = ?
            WHERE id = ?
        `);
        return stmt.run(
            taskData.title,
            taskData.description,
            taskData.category,
            taskData.priority,
            taskData.assignment_type,
            taskData.assigned_to || null,
            taskData.assigned_date || null,
            taskData.due_date,
            taskData.due_time,
            taskData.recurrence || 'none',
            id
        );
    }
    
    completeTask(id, userId, notes, photoPath) {
        const stmt = this.db.prepare(`
            UPDATE tasks 
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP,
                completed_by = ?,
                completion_notes = ?,
                completion_photo = ?
            WHERE id = ?
        `);
        return stmt.run(userId, notes, photoPath, id);
    }
    
    updateTaskStatus(id, status) {
        return this.db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id);
    }
    
    deleteTask(id) {
        return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    }
    
    // Notification operations
    createNotification(userId, taskId, message, type) {
        const stmt = this.db.prepare(`
            INSERT INTO notifications (user_id, task_id, message, type)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(userId, taskId, message, type);
    }
    
    getUserNotifications(userId, unreadOnly = false) {
        let query = `
            SELECT n.*, t.title as task_title
            FROM notifications n
            LEFT JOIN tasks t ON n.task_id = t.id
            WHERE n.user_id = ?
        `;
        
        if (unreadOnly) {
            query += ' AND n.read = 0';
        }
        
        query += ' ORDER BY n.created_at DESC LIMIT 50';
        
        return this.db.prepare(query).all(userId);
    }
    
    markNotificationRead(id) {
        return this.db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    }
    
    markAllNotificationsRead(userId) {
        return this.db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
    }
    
    // Shift schedule operations
    createShiftSchedule(scheduleData) {
        const stmt = this.db.prepare(`
            INSERT INTO shift_schedules (user_id, shift_date, shift_start, shift_end, role, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            scheduleData.user_id,
            scheduleData.shift_date,
            scheduleData.shift_start,
            scheduleData.shift_end,
            scheduleData.role,
            scheduleData.notes
        );
    }
    
    getShiftSchedulesByDate(date) {
        return this.db.prepare(`
            SELECT s.*, u.full_name, u.username
            FROM shift_schedules s
            JOIN users u ON s.user_id = u.id
            WHERE DATE(s.shift_date) = DATE(?)
            ORDER BY s.shift_start
        `).all(date);
    }
    
    getShiftSchedulesByUser(userId, startDate, endDate) {
        return this.db.prepare(`
            SELECT * FROM shift_schedules
            WHERE user_id = ? 
            AND shift_date BETWEEN ? AND ?
            ORDER BY shift_date, shift_start
        `).all(userId, startDate, endDate);
    }
    
    getUsersOnShift(date) {
        return this.db.prepare(`
            SELECT DISTINCT u.id, u.username, u.full_name, u.role
            FROM shift_schedules s
            JOIN users u ON s.user_id = u.id
            WHERE DATE(s.shift_date) = DATE(?)
        `).all(date);
    }
    
    // Task template operations
    createTaskTemplate(templateData) {
        const stmt = this.db.prepare(`
            INSERT INTO task_templates (name, description, category, priority, estimated_duration, recurrence_pattern, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            templateData.name,
            templateData.description,
            templateData.category,
            templateData.priority,
            templateData.estimated_duration,
            templateData.recurrence_pattern,
            templateData.created_by
        );
    }
    
    getAllTaskTemplates() {
        return this.db.prepare('SELECT * FROM task_templates ORDER BY name').all();
    }
    
    getTaskTemplateById(id) {
        return this.db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id);
    }
    
    deleteTaskTemplate(id) {
        return this.db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
    }
    
    // Audit log
    logAction(userId, action, entityType, entityId, details, ipAddress) {
        const stmt = this.db.prepare(`
            INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, action, entityType, entityId, details, ipAddress);
    }
    
    // Statistics and reports
    getTaskStatistics() {
        return {
            total: this.db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
            completed: this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "completed"').get().count,
            pending: this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "pending"').get().count,
            overdue: this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "overdue"').get().count,
            byCategory: this.db.prepare('SELECT category, COUNT(*) as count FROM tasks GROUP BY category').all(),
            byPriority: this.db.prepare('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority').all()
        };
    }
    
    // Permission management
    getUserPermissions(userId) {
        // Get role-based permissions
        const user = this.getUserById(userId);
        if (!user) return [];
        
        const rolePermissions = this.db.prepare(`
            SELECT permission FROM role_permissions WHERE role = ?
        `).all(user.role).map(p => p.permission);
        
        // Get user-specific permissions
        const userPermissions = this.db.prepare(`
            SELECT permission FROM user_permissions WHERE user_id = ?
        `).all(userId).map(p => p.permission);
        
        // Combine and deduplicate
        return [...new Set([...rolePermissions, ...userPermissions])];
    }
    
    hasPermission(userId, permission) {
        const permissions = this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
    
    grantPermission(userId, permission, grantedBy) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by)
            VALUES (?, ?, ?)
        `);
        return stmt.run(userId, permission, grantedBy);
    }
    
    revokePermission(userId, permission) {
        return this.db.prepare(`
            DELETE FROM user_permissions WHERE user_id = ? AND permission = ?
        `).run(userId, permission);
    }
    
    getAllPermissions() {
        return this.db.prepare(`
            SELECT DISTINCT permission FROM role_permissions ORDER BY permission
        `).all();
    }
    
    getRolePermissions(role) {
        return this.db.prepare(`
            SELECT permission FROM role_permissions WHERE role = ?
        `).all(role).map(p => p.permission);
    }
    
    getUserCustomPermissions(userId) {
        return this.db.prepare(`
            SELECT up.*, u.full_name as granted_by_name
            FROM user_permissions up
            LEFT JOIN users u ON up.granted_by = u.id
            WHERE up.user_id = ?
        `).all(userId);
    }
// Stock Management Methods for DatabaseManager
// Add these methods to the DatabaseManager class

// ============================================
// STOCK CATEGORIES
// ============================================

getStockCategories() {
    return this.db.prepare(`
        SELECT * FROM stock_categories ORDER BY name
    `).all();
}

// ============================================
// STOCK ITEMS
// ============================================

getStockItems(filters = {}) {
    let query = `
        SELECT si.*, sc.name as category_name,
               CASE 
                   WHEN si.current_quantity <= si.minimum_quantity THEN 'low'
                   WHEN si.current_quantity = 0 THEN 'out'
                   ELSE 'ok'
               END as stock_status
        FROM stock_items si
        LEFT JOIN stock_categories sc ON si.category_id = sc.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.category) {
        query += ` AND si.category_id = ?`;
        params.push(filters.category);
    }
    
    if (filters.active !== undefined) {
        query += ` AND si.active = ?`;
        params.push(filters.active);
    }
    
    if (filters.low_stock) {
        query += ` AND si.current_quantity <= si.minimum_quantity`;
    }
    
    query += ` ORDER BY si.name`;
    
    return this.db.prepare(query).all(...params);
}

getStockItem(id) {
    return this.db.prepare(`
        SELECT si.*, sc.name as category_name
        FROM stock_items si
        LEFT JOIN stock_categories sc ON si.category_id = sc.id
        WHERE si.id = ?
    `).get(id);
}

createStockItem(data) {
    const stmt = this.db.prepare(`
        INSERT INTO stock_items (
            name, category_id, unit, sku, supplier,
            minimum_quantity, maximum_quantity, unit_cost, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
        data.name, data.category_id, data.unit, data.sku, data.supplier,
        data.minimum_quantity || 0, data.maximum_quantity || 0,
        data.unit_cost || 0, data.notes
    );
}

updateStockItem(id, data) {
    const stmt = this.db.prepare(`
        UPDATE stock_items SET
            name = COALESCE(?, name),
            category_id = COALESCE(?, category_id),
            unit = COALESCE(?, unit),
            sku = COALESCE(?, sku),
            supplier = COALESCE(?, supplier),
            minimum_quantity = COALESCE(?, minimum_quantity),
            maximum_quantity = COALESCE(?, maximum_quantity),
            unit_cost = COALESCE(?, unit_cost),
            notes = COALESCE(?, notes),
            active = COALESCE(?, active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    return stmt.run(
        data.name, data.category_id, data.unit, data.sku, data.supplier,
        data.minimum_quantity, data.maximum_quantity, data.unit_cost,
        data.notes, data.active, id
    );
}

deleteStockItem(id) {
    return this.db.prepare(`DELETE FROM stock_items WHERE id = ?`).run(id);
}

updateStockQuantity(itemId, quantityChange) {
    return this.db.prepare(`
        UPDATE stock_items 
        SET current_quantity = current_quantity + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(quantityChange, itemId);
}

// ============================================
// STOCK DELIVERIES
// ============================================

getStockDeliveries(filters = {}) {
    let query = `
        SELECT sd.*, 
               u1.full_name as created_by_name,
               u2.full_name as received_by_name,
               COUNT(di.id) as item_count
        FROM stock_deliveries sd
        LEFT JOIN users u1 ON sd.created_by = u1.id
        LEFT JOIN users u2 ON sd.received_by = u2.id
        LEFT JOIN delivery_items di ON sd.id = di.delivery_id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
        query += ` AND sd.status = ?`;
        params.push(filters.status);
    }
    
    if (filters.from_date) {
        query += ` AND sd.delivery_date >= ?`;
        params.push(filters.from_date);
    }
    
    if (filters.to_date) {
        query += ` AND sd.delivery_date <= ?`;
        params.push(filters.to_date);
    }
    
    query += ` GROUP BY sd.id ORDER BY sd.delivery_date DESC, sd.created_at DESC`;
    
    return this.db.prepare(query).all(...params);
}

getStockDelivery(id) {
    return this.db.prepare(`
        SELECT sd.*, 
               u1.full_name as created_by_name,
               u2.full_name as received_by_name
        FROM stock_deliveries sd
        LEFT JOIN users u1 ON sd.created_by = u1.id
        LEFT JOIN users u2 ON sd.received_by = u2.id
        WHERE sd.id = ?
    `).get(id);
}

createStockDelivery(data) {
    const stmt = this.db.prepare(`
        INSERT INTO stock_deliveries (
            delivery_date, supplier, invoice_number, invoice_amount,
            notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
        data.delivery_date, data.supplier, data.invoice_number,
        data.invoice_amount, data.notes, data.created_by
    );
}

acceptStockDelivery(id, userId) {
    return this.db.prepare(`
        UPDATE stock_deliveries 
        SET status = 'accepted',
            received_by = ?,
            received_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(userId, id);
}

rejectStockDelivery(id, userId, reason) {
    return this.db.prepare(`
        UPDATE stock_deliveries 
        SET status = 'rejected',
            received_by = ?,
            received_at = CURRENT_TIMESTAMP,
            notes = COALESCE(notes || ' | ', '') || 'Rejected: ' || ?
        WHERE id = ?
    `).run(userId, reason, id);
}

// ============================================
// DELIVERY ITEMS
// ============================================

getDeliveryItems(deliveryId) {
    return this.db.prepare(`
        SELECT di.*, si.name as item_name, si.unit
        FROM delivery_items di
        LEFT JOIN stock_items si ON di.stock_item_id = si.id
        WHERE di.delivery_id = ?
        ORDER BY si.name
    `).all(deliveryId);
}

addDeliveryItem(deliveryId, item) {
    const stmt = this.db.prepare(`
        INSERT INTO delivery_items (
            delivery_id, stock_item_id, quantity, unit_cost,
            expiry_date, batch_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
        deliveryId, item.stock_item_id, item.quantity, item.unit_cost,
        item.expiry_date, item.batch_number, item.notes
    );
}

updateDeliveryItemDamaged(itemId, damagedQuantity) {
    return this.db.prepare(`
        UPDATE delivery_items 
        SET damaged_quantity = ?
        WHERE id = ?
    `).run(damagedQuantity, itemId);
}

// ============================================
// STOCK BATCHES
// ============================================

getStockBatches(stockItemId, activeOnly = true) {
    let query = `
        SELECT sb.*, di.delivery_id
        FROM stock_batches sb
        LEFT JOIN delivery_items di ON sb.delivery_item_id = di.id
        WHERE sb.stock_item_id = ?
    `;
    
    if (activeOnly) {
        query += ` AND sb.status = 'active' AND sb.remaining_quantity > 0`;
    }
    
    query += ` ORDER BY sb.expiry_date ASC, sb.received_date ASC`;
    
    return this.db.prepare(query).all(stockItemId);
}

getExpiringBatches(days = 30) {
    return this.db.prepare(`
        SELECT sb.*, si.name as item_name, si.unit
        FROM stock_batches sb
        LEFT JOIN stock_items si ON sb.stock_item_id = si.id
        WHERE sb.status = 'active' 
          AND sb.remaining_quantity > 0
          AND sb.expiry_date IS NOT NULL
          AND sb.expiry_date <= date('now', '+' || ? || ' days')
        ORDER BY sb.expiry_date ASC
    `).all(days);
}

createStockBatch(data) {
    const stmt = this.db.prepare(`
        INSERT INTO stock_batches (
            stock_item_id, delivery_item_id, batch_number,
            quantity, remaining_quantity, expiry_date, received_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
        data.stock_item_id, data.delivery_item_id, data.batch_number,
        data.quantity, data.remaining_quantity, data.expiry_date, data.received_date
    );
}

updateBatchQuantity(batchId, quantityChange) {
    return this.db.prepare(`
        UPDATE stock_batches 
        SET remaining_quantity = remaining_quantity + ?
        WHERE id = ?
    `).run(quantityChange, batchId);
}

// ============================================
// STOCK TRANSACTIONS
// ============================================

getStockTransactions(stockItemId, limit = 100) {
    return this.db.prepare(`
        SELECT st.*, u.full_name as performed_by_name
        FROM stock_transactions st
        LEFT JOIN users u ON st.performed_by = u.id
        WHERE st.stock_item_id = ?
        ORDER BY st.performed_at DESC
        LIMIT ?
    `).all(stockItemId, limit);
}

recordStockTransaction(data) {
    const stmt = this.db.prepare(`
        INSERT INTO stock_transactions (
            stock_item_id, batch_id, transaction_type, quantity,
            reference_type, reference_id, notes, performed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
        data.stock_item_id, data.batch_id, data.transaction_type, data.quantity,
        data.reference_type, data.reference_id, data.notes, data.performed_by
    );
}

// ============================================
// STOCK ALERTS
// ============================================

getStockAlerts(filters = {}) {
    let query = `
        SELECT sa.*, si.name as item_name, u.full_name as acknowledged_by_name
        FROM stock_alerts sa
        LEFT JOIN stock_items si ON sa.stock_item_id = si.id
        LEFT JOIN users u ON sa.acknowledged_by = u.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.acknowledged !== undefined) {
        query += ` AND sa.acknowledged = ?`;
        params.push(filters.acknowledged);
    }
    
    query += ` ORDER BY sa.severity DESC, sa.created_at DESC`;
    
    return this.db.prepare(query).all(...params);
}

createStockAlert(data) {
    const stmt = this.db.prepare(`
        INSERT INTO stock_alerts (
            alert_type, stock_item_id, batch_id, message, severity
        ) VALUES (?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
        data.alert_type, data.stock_item_id, data.batch_id,
        data.message, data.severity
    );
}

acknowledgeStockAlert(alertId, userId) {
    return this.db.prepare(`
        UPDATE stock_alerts 
        SET acknowledged = 1,
            acknowledged_by = ?,
            acknowledged_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(userId, alertId);
}

checkStockLevels() {
    // Get items with low stock
    const lowStockItems = this.db.prepare(`
        SELECT * FROM stock_items 
        WHERE active = 1 
          AND current_quantity <= minimum_quantity
          AND current_quantity > 0
    `).all();
    
    for (const item of lowStockItems) {
        // Check if alert already exists
        const existingAlert = this.db.prepare(`
            SELECT id FROM stock_alerts 
            WHERE stock_item_id = ? 
              AND alert_type = 'low_stock' 
              AND acknowledged = 0
        `).get(item.id);
        
        if (!existingAlert) {
            this.createStockAlert({
                alert_type: 'low_stock',
                stock_item_id: item.id,
                message: `${item.name} is running low (${item.current_quantity} ${item.unit} remaining)`,
                severity: 'medium'
            });
        }
    }
    
    // Get out of stock items
    const outOfStockItems = this.db.prepare(`
        SELECT * FROM stock_items 
        WHERE active = 1 AND current_quantity = 0
    `).all();
    
    for (const item of outOfStockItems) {
        const existingAlert = this.db.prepare(`
            SELECT id FROM stock_alerts 
            WHERE stock_item_id = ? 
              AND alert_type = 'out_of_stock' 
              AND acknowledged = 0
        `).get(item.id);
        
        if (!existingAlert) {
            this.createStockAlert({
                alert_type: 'out_of_stock',
                stock_item_id: item.id,
                message: `${item.name} is out of stock`,
                severity: 'high'
            });
        }
    }
    
    // Check for expiring batches (within 7 days)
    const expiringBatches = this.getExpiringBatches(7);
    
    for (const batch of expiringBatches) {
        const existingAlert = this.db.prepare(`
            SELECT id FROM stock_alerts 
            WHERE batch_id = ? 
              AND alert_type = 'expiring_soon' 
              AND acknowledged = 0
        `).get(batch.id);
        
        if (!existingAlert) {
            this.createStockAlert({
                alert_type: 'expiring_soon',
                stock_item_id: batch.stock_item_id,
                batch_id: batch.id,
                message: `${batch.item_name} batch expires on ${batch.expiry_date}`,
                severity: 'medium'
            });
        }
    }
}

// ============================================
// REPORTS
// ============================================

getStockSummary() {
    return {
        totalItems: this.db.prepare(`SELECT COUNT(*) as count FROM stock_items WHERE active = 1`).get().count,
        lowStockItems: this.db.prepare(`SELECT COUNT(*) as count FROM stock_items WHERE active = 1 AND current_quantity <= minimum_quantity AND current_quantity > 0`).get().count,
        outOfStockItems: this.db.prepare(`SELECT COUNT(*) as count FROM stock_items WHERE active = 1 AND current_quantity = 0`).get().count,
        pendingDeliveries: this.db.prepare(`SELECT COUNT(*) as count FROM stock_deliveries WHERE status = 'pending'`).get().count,
        expiringBatches: this.db.prepare(`SELECT COUNT(*) as count FROM stock_batches WHERE status = 'active' AND expiry_date <= date('now', '+7 days')`).get().count,
        totalValue: this.db.prepare(`SELECT SUM(current_quantity * unit_cost) as total FROM stock_items WHERE active = 1`).get().total || 0
    };
}

getStockValuation() {
    return this.db.prepare(`
        SELECT si.*, sc.name as category_name,
               (si.current_quantity * si.unit_cost) as total_value
        FROM stock_items si
        LEFT JOIN stock_categories sc ON si.category_id = sc.id
        WHERE si.active = 1
        ORDER BY total_value DESC
    `).all();
}    close() {
        this.db.close();
    }
}

module.exports = DatabaseManager;