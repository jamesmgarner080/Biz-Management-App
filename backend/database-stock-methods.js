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
}