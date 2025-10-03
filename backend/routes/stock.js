const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../auth');

module.exports = (db) => {
    // ============================================
    // STOCK CATEGORIES
    // ============================================
    
    // Get all categories
    router.get('/categories', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const categories = db.getStockCategories();
            res.json(categories);
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    });
    
    // ============================================
    // STOCK ITEMS
    // ============================================
    
    // Get all stock items
    router.get('/items', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const { category, active, low_stock } = req.query;
            const items = db.getStockItems({ category, active, low_stock });
            res.json(items);
        } catch (error) {
            console.error('Get stock items error:', error);
            res.status(500).json({ error: 'Failed to fetch stock items' });
        }
    });
    
    // Get single stock item
    router.get('/items/:id', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const item = db.getStockItem(req.params.id);
            if (!item) {
                return res.status(404).json({ error: 'Stock item not found' });
            }
            res.json(item);
        } catch (error) {
            console.error('Get stock item error:', error);
            res.status(500).json({ error: 'Failed to fetch stock item' });
        }
    });
    
    // Create stock item
    router.post('/items', authenticateToken, requirePermission('manage_stock'), (req, res) => {
        try {
            const { name, category_id, unit, sku, supplier, minimum_quantity, maximum_quantity, unit_cost, notes } = req.body;
            
            if (!name || !category_id || !unit) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const result = db.createStockItem({
                name, category_id, unit, sku, supplier, 
                minimum_quantity, maximum_quantity, unit_cost, notes
            });
            
            db.logAction(req.user.id, 'create_stock_item', 'stock_item', result.lastInsertRowid,
                `Created stock item: ${name}`, req.ip);
            
            res.status(201).json({
                message: 'Stock item created successfully',
                itemId: result.lastInsertRowid
            });
        } catch (error) {
            console.error('Create stock item error:', error);
            res.status(500).json({ error: 'Failed to create stock item' });
        }
    });
    
    // Update stock item
    router.put('/items/:id', authenticateToken, requirePermission('manage_stock'), (req, res) => {
        try {
            const { name, category_id, unit, sku, supplier, minimum_quantity, maximum_quantity, unit_cost, notes, active } = req.body;
            
            db.updateStockItem(req.params.id, {
                name, category_id, unit, sku, supplier,
                minimum_quantity, maximum_quantity, unit_cost, notes, active
            });
            
            db.logAction(req.user.id, 'update_stock_item', 'stock_item', req.params.id,
                `Updated stock item: ${name}`, req.ip);
            
            res.json({ message: 'Stock item updated successfully' });
        } catch (error) {
            console.error('Update stock item error:', error);
            res.status(500).json({ error: 'Failed to update stock item' });
        }
    });
    
    // Delete stock item
    router.delete('/items/:id', authenticateToken, requirePermission('manage_stock'), (req, res) => {
        try {
            db.deleteStockItem(req.params.id);
            
            db.logAction(req.user.id, 'delete_stock_item', 'stock_item', req.params.id,
                'Deleted stock item', req.ip);
            
            res.json({ message: 'Stock item deleted successfully' });
        } catch (error) {
            console.error('Delete stock item error:', error);
            res.status(500).json({ error: 'Failed to delete stock item' });
        }
    });
    
    // ============================================
    // STOCK DELIVERIES
    // ============================================
    
    // Get all deliveries
    router.get('/deliveries', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const { status, from_date, to_date } = req.query;
            const deliveries = db.getStockDeliveries({ status, from_date, to_date });
            res.json(deliveries);
        } catch (error) {
            console.error('Get deliveries error:', error);
            res.status(500).json({ error: 'Failed to fetch deliveries' });
        }
    });
    
    // Get single delivery with items
    router.get('/deliveries/:id', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const delivery = db.getStockDelivery(req.params.id);
            if (!delivery) {
                return res.status(404).json({ error: 'Delivery not found' });
            }
            
            const items = db.getDeliveryItems(req.params.id);
            delivery.items = items;
            
            res.json(delivery);
        } catch (error) {
            console.error('Get delivery error:', error);
            res.status(500).json({ error: 'Failed to fetch delivery' });
        }
    });
    
    // Create delivery
    router.post('/deliveries', authenticateToken, requirePermission('accept_deliveries'), (req, res) => {
        try {
            const { delivery_date, supplier, invoice_number, invoice_amount, notes, items } = req.body;
            
            if (!delivery_date || !supplier || !items || items.length === 0) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const result = db.createStockDelivery({
                delivery_date, supplier, invoice_number, invoice_amount, notes,
                created_by: req.user.id
            });
            
            const deliveryId = result.lastInsertRowid;
            
            // Add delivery items
            for (const item of items) {
                db.addDeliveryItem(deliveryId, item);
            }
            
            db.logAction(req.user.id, 'create_delivery', 'stock_delivery', deliveryId,
                `Created delivery from ${supplier}`, req.ip);
            
            res.status(201).json({
                message: 'Delivery created successfully',
                deliveryId: deliveryId
            });
        } catch (error) {
            console.error('Create delivery error:', error);
            res.status(500).json({ error: 'Failed to create delivery' });
        }
    });
    
    // Accept delivery
    router.post('/deliveries/:id/accept', authenticateToken, requirePermission('accept_deliveries'), (req, res) => {
        try {
            const { items } = req.body; // Items with actual received quantities
            
            const delivery = db.getStockDelivery(req.params.id);
            if (!delivery) {
                return res.status(404).json({ error: 'Delivery not found' });
            }
            
            if (delivery.status !== 'pending') {
                return res.status(400).json({ error: 'Delivery already processed' });
            }
            
            // Update delivery status
            db.acceptStockDelivery(req.params.id, req.user.id);
            
            // Process each item
            const deliveryItems = db.getDeliveryItems(req.params.id);
            for (const item of deliveryItems) {
                const receivedItem = items.find(i => i.id === item.id);
                if (receivedItem) {
                    // Create stock batch
                    const batchResult = db.createStockBatch({
                        stock_item_id: item.stock_item_id,
                        delivery_item_id: item.id,
                        batch_number: item.batch_number,
                        quantity: receivedItem.quantity,
                        remaining_quantity: receivedItem.quantity,
                        expiry_date: item.expiry_date,
                        received_date: delivery.delivery_date
                    });
                    
                    // Update stock item quantity
                    db.updateStockQuantity(item.stock_item_id, receivedItem.quantity);
                    
                    // Record transaction
                    db.recordStockTransaction({
                        stock_item_id: item.stock_item_id,
                        batch_id: batchResult.lastInsertRowid,
                        transaction_type: 'delivery',
                        quantity: receivedItem.quantity,
                        reference_type: 'delivery',
                        reference_id: req.params.id,
                        notes: `Delivery accepted: ${delivery.supplier}`,
                        performed_by: req.user.id
                    });
                    
                    // Update damaged quantity if any
                    if (receivedItem.damaged_quantity > 0) {
                        db.updateDeliveryItemDamaged(item.id, receivedItem.damaged_quantity);
                    }
                }
            }
            
            // Check for low stock and create alerts
            db.checkStockLevels();
            
            db.logAction(req.user.id, 'accept_delivery', 'stock_delivery', req.params.id,
                `Accepted delivery from ${delivery.supplier}`, req.ip);
            
            res.json({ message: 'Delivery accepted successfully' });
        } catch (error) {
            console.error('Accept delivery error:', error);
            res.status(500).json({ error: 'Failed to accept delivery' });
        }
    });
    
    // Reject delivery
    router.post('/deliveries/:id/reject', authenticateToken, requirePermission('accept_deliveries'), (req, res) => {
        try {
            const { reason } = req.body;
            
            db.rejectStockDelivery(req.params.id, req.user.id, reason);
            
            db.logAction(req.user.id, 'reject_delivery', 'stock_delivery', req.params.id,
                `Rejected delivery: ${reason}`, req.ip);
            
            res.json({ message: 'Delivery rejected successfully' });
        } catch (error) {
            console.error('Reject delivery error:', error);
            res.status(500).json({ error: 'Failed to reject delivery' });
        }
    });
    
    // ============================================
    // STOCK BATCHES
    // ============================================
    
    // Get batches for a stock item
    router.get('/items/:id/batches', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const batches = db.getStockBatches(req.params.id);
            res.json(batches);
        } catch (error) {
            console.error('Get batches error:', error);
            res.status(500).json({ error: 'Failed to fetch batches' });
        }
    });
    
    // Get expiring batches
    router.get('/batches/expiring', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const { days = 30 } = req.query;
            const batches = db.getExpiringBatches(days);
            res.json(batches);
        } catch (error) {
            console.error('Get expiring batches error:', error);
            res.status(500).json({ error: 'Failed to fetch expiring batches' });
        }
    });
    
    // ============================================
    // STOCK TRANSACTIONS
    // ============================================
    
    // Get transactions for a stock item
    router.get('/items/:id/transactions', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const transactions = db.getStockTransactions(req.params.id);
            res.json(transactions);
        } catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    });
    
    // Manual stock adjustment
    router.post('/items/:id/adjust', authenticateToken, requirePermission('adjust_stock'), (req, res) => {
        try {
            const { quantity, reason, transaction_type = 'adjustment' } = req.body;
            
            if (!quantity || !reason) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Update stock quantity
            db.updateStockQuantity(req.params.id, quantity);
            
            // Record transaction
            db.recordStockTransaction({
                stock_item_id: req.params.id,
                transaction_type,
                quantity,
                notes: reason,
                performed_by: req.user.id
            });
            
            db.logAction(req.user.id, 'adjust_stock', 'stock_item', req.params.id,
                `Stock adjustment: ${quantity} - ${reason}`, req.ip);
            
            res.json({ message: 'Stock adjusted successfully' });
        } catch (error) {
            console.error('Adjust stock error:', error);
            res.status(500).json({ error: 'Failed to adjust stock' });
        }
    });
    
    // ============================================
    // STOCK ALERTS
    // ============================================
    
    // Get all alerts
    router.get('/alerts', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            const { acknowledged } = req.query;
            const alerts = db.getStockAlerts({ acknowledged });
            res.json(alerts);
        } catch (error) {
            console.error('Get alerts error:', error);
            res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    });
    
    // Acknowledge alert
    router.post('/alerts/:id/acknowledge', authenticateToken, requirePermission('view_stock'), (req, res) => {
        try {
            db.acknowledgeStockAlert(req.params.id, req.user.id);
            res.json({ message: 'Alert acknowledged' });
        } catch (error) {
            console.error('Acknowledge alert error:', error);
            res.status(500).json({ error: 'Failed to acknowledge alert' });
        }
    });
    
    // ============================================
    // REPORTS
    // ============================================
    
    // Stock summary report
    router.get('/reports/summary', authenticateToken, requirePermission('view_stock_reports'), (req, res) => {
        try {
            const summary = db.getStockSummary();
            res.json(summary);
        } catch (error) {
            console.error('Get stock summary error:', error);
            res.status(500).json({ error: 'Failed to fetch stock summary' });
        }
    });
    
    // Stock valuation report
    router.get('/reports/valuation', authenticateToken, requirePermission('view_stock_reports'), (req, res) => {
        try {
            const valuation = db.getStockValuation();
            res.json(valuation);
        } catch (error) {
            console.error('Get stock valuation error:', error);
            res.status(500).json({ error: 'Failed to fetch stock valuation' });
        }
    });
    
    return router;
};