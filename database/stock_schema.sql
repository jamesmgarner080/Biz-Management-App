-- ============================================
-- STOCK DELIVERY MANAGEMENT SCHEMA
-- ============================================

-- Stock Categories
CREATE TABLE IF NOT EXISTS stock_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stock Items (Master list of all items that can be stocked)
CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    unit TEXT NOT NULL, -- 'bottles', 'cases', 'kegs', 'kg', 'liters', etc.
    sku TEXT UNIQUE, -- Stock Keeping Unit
    supplier TEXT,
    current_quantity REAL DEFAULT 0,
    minimum_quantity REAL DEFAULT 0, -- Alert when below this
    maximum_quantity REAL DEFAULT 0, -- Maximum storage capacity
    unit_cost REAL DEFAULT 0,
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES stock_categories(id)
);

-- Stock Deliveries (Records of deliveries received)
CREATE TABLE IF NOT EXISTS stock_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_date DATE NOT NULL,
    supplier TEXT NOT NULL,
    invoice_number TEXT,
    invoice_amount REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'partial')),
    received_by INTEGER, -- User who accepted the delivery
    received_at DATETIME,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (received_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Delivery Items (Items in each delivery with expiry dates)
CREATE TABLE IF NOT EXISTS delivery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    stock_item_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL,
    expiry_date DATE, -- Expiry date for perishable items
    batch_number TEXT, -- Batch/lot number for tracking
    damaged_quantity REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delivery_id) REFERENCES stock_deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id)
);

-- Stock Batches (Track individual batches with expiry dates)
CREATE TABLE IF NOT EXISTS stock_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_item_id INTEGER NOT NULL,
    delivery_item_id INTEGER, -- Link to original delivery
    batch_number TEXT,
    quantity REAL NOT NULL,
    remaining_quantity REAL NOT NULL,
    expiry_date DATE,
    received_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'depleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id),
    FOREIGN KEY (delivery_item_id) REFERENCES delivery_items(id)
);

-- Stock Transactions (Audit trail of all stock movements)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_item_id INTEGER NOT NULL,
    batch_id INTEGER,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('delivery', 'usage', 'adjustment', 'waste', 'return')),
    quantity REAL NOT NULL, -- Positive for additions, negative for removals
    reference_type TEXT, -- 'delivery', 'task', 'manual', etc.
    reference_id INTEGER, -- ID of related record
    notes TEXT,
    performed_by INTEGER NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id),
    FOREIGN KEY (batch_id) REFERENCES stock_batches(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Stock Alerts (Automated alerts for low stock and expiring items)
CREATE TABLE IF NOT EXISTS stock_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('low_stock', 'expiring_soon', 'expired', 'out_of_stock')),
    stock_item_id INTEGER,
    batch_id INTEGER,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    acknowledged INTEGER DEFAULT 0,
    acknowledged_by INTEGER,
    acknowledged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id),
    FOREIGN KEY (batch_id) REFERENCES stock_batches(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_active ON stock_items(active);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON stock_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON stock_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_items_delivery ON delivery_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_items_stock ON delivery_items(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_batches_stock_item ON stock_batches(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON stock_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON stock_batches(status);
CREATE INDEX IF NOT EXISTS idx_transactions_stock_item ON stock_transactions(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON stock_transactions(performed_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON stock_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON stock_alerts(acknowledged);

-- Insert default stock categories
INSERT OR IGNORE INTO stock_categories (name, description) VALUES
('Spirits', 'Whiskey, Vodka, Rum, Gin, Tequila, etc.'),
('Beer', 'Draft beer, bottled beer, canned beer'),
('Wine', 'Red wine, white wine, sparkling wine'),
('Mixers', 'Sodas, juices, tonic water, etc.'),
('Garnishes', 'Fruits, herbs, olives, cherries, etc.'),
('Bar Supplies', 'Straws, napkins, coasters, stirrers'),
('Cleaning Supplies', 'Detergents, sanitizers, towels'),
('Glassware', 'Glasses, mugs, shot glasses'),
('Food Items', 'Snacks, appetizers, perishable items'),
('Other', 'Miscellaneous items');

-- Stock permissions will be managed through role_permissions table
-- Available permissions:
-- - manage_stock: Create, edit, and delete stock items
-- - view_stock: View stock levels and inventory
-- - accept_deliveries: Accept and process stock deliveries
-- - adjust_stock: Make manual stock adjustments
-- - view_stock_reports: View stock reports and analytics

-- Grant stock permissions to appropriate roles
-- Admin gets all permissions (already has via role)
-- Managers get all stock permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('manager', 'manage_stock'),
('manager', 'view_stock'),
('manager', 'accept_deliveries'),
('manager', 'adjust_stock'),
('manager', 'view_stock_reports');

-- Supervisors get most stock permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('supervisor', 'view_stock'),
('supervisor', 'accept_deliveries'),
('supervisor', 'view_stock_reports');

-- Bar staff can view stock
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('bar_staff', 'view_stock');