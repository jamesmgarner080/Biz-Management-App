-- ============================================
-- SAMPLE STOCK DATA FOR TESTING
-- ============================================

-- Sample Stock Items
INSERT INTO stock_items (name, category_id, unit, sku, supplier, current_quantity, minimum_quantity, maximum_quantity, unit_cost, notes) VALUES
-- Spirits
('Jack Daniels Whiskey', 1, 'bottles', 'JD-750', 'Premium Spirits Co', 24, 12, 48, 28.50, '750ml bottles'),
('Absolut Vodka', 1, 'bottles', 'ABS-750', 'Premium Spirits Co', 18, 12, 48, 22.00, '750ml bottles'),
('Bacardi White Rum', 1, 'bottles', 'BAC-750', 'Premium Spirits Co', 15, 12, 48, 19.50, '750ml bottles'),
('Tanqueray Gin', 1, 'bottles', 'TAN-750', 'Premium Spirits Co', 20, 12, 48, 26.00, '750ml bottles'),
('Patron Silver Tequila', 1, 'bottles', 'PAT-750', 'Premium Spirits Co', 10, 8, 32, 45.00, '750ml bottles'),

-- Beer
('Budweiser Draft', 2, 'kegs', 'BUD-KEG', 'Beer Distributors Inc', 4, 2, 8, 120.00, '15.5 gallon kegs'),
('Corona Extra', 2, 'cases', 'COR-24', 'Beer Distributors Inc', 8, 4, 20, 32.00, '24-pack bottles'),
('Heineken', 2, 'cases', 'HEI-24', 'Beer Distributors Inc', 6, 4, 20, 35.00, '24-pack bottles'),
('Guinness Stout', 2, 'cases', 'GUI-24', 'Beer Distributors Inc', 5, 3, 15, 38.00, '24-pack cans'),

-- Wine
('Cabernet Sauvignon', 3, 'bottles', 'CAB-750', 'Wine Merchants', 12, 6, 24, 18.00, 'House red wine'),
('Chardonnay', 3, 'bottles', 'CHAR-750', 'Wine Merchants', 10, 6, 24, 16.00, 'House white wine'),
('Prosecco', 3, 'bottles', 'PROS-750', 'Wine Merchants', 8, 4, 20, 14.00, 'Sparkling wine'),

-- Mixers
('Coca-Cola', 4, 'cases', 'COKE-24', 'Beverage Supply Co', 15, 8, 30, 18.00, '24-pack cans'),
('Sprite', 4, 'cases', 'SPR-24', 'Beverage Supply Co', 12, 8, 30, 18.00, '24-pack cans'),
('Tonic Water', 4, 'cases', 'TON-24', 'Beverage Supply Co', 10, 6, 24, 22.00, '24-pack bottles'),
('Orange Juice', 4, 'liters', 'OJ-1L', 'Fresh Produce Co', 8, 6, 20, 4.50, '1L cartons - refrigerate'),
('Cranberry Juice', 4, 'liters', 'CRAN-1L', 'Fresh Produce Co', 6, 4, 16, 5.00, '1L cartons - refrigerate'),

-- Garnishes
('Limes', 5, 'kg', 'LIME-KG', 'Fresh Produce Co', 3, 2, 10, 6.00, 'Fresh limes - check daily'),
('Lemons', 5, 'kg', 'LEM-KG', 'Fresh Produce Co', 3, 2, 10, 5.50, 'Fresh lemons - check daily'),
('Mint', 5, 'bunches', 'MINT-BUN', 'Fresh Produce Co', 4, 2, 8, 3.00, 'Fresh mint - refrigerate'),
('Olives', 5, 'jars', 'OLV-JAR', 'Bar Supply Co', 6, 3, 12, 8.00, 'Cocktail olives'),
('Maraschino Cherries', 5, 'jars', 'CHER-JAR', 'Bar Supply Co', 5, 3, 12, 7.50, 'Cocktail cherries'),

-- Bar Supplies
('Cocktail Straws', 6, 'boxes', 'STRAW-BOX', 'Bar Supply Co', 8, 4, 20, 12.00, '1000 per box'),
('Cocktail Napkins', 6, 'boxes', 'NAP-BOX', 'Bar Supply Co', 10, 5, 25, 15.00, '500 per box'),
('Coasters', 6, 'boxes', 'COAST-BOX', 'Bar Supply Co', 6, 3, 15, 18.00, '100 per box'),
('Stir Sticks', 6, 'boxes', 'STIR-BOX', 'Bar Supply Co', 7, 4, 20, 10.00, '1000 per box'),

-- Cleaning Supplies
('Bar Sanitizer', 7, 'bottles', 'SAN-1L', 'Cleaning Supply Co', 8, 4, 20, 12.00, '1L bottles'),
('Glass Cleaner', 7, 'bottles', 'GLS-1L', 'Cleaning Supply Co', 6, 3, 15, 8.00, '1L spray bottles'),
('Bar Towels', 7, 'packs', 'TOW-12', 'Cleaning Supply Co', 10, 5, 25, 25.00, '12-pack cotton towels'),
('Dish Soap', 7, 'bottles', 'DISH-1L', 'Cleaning Supply Co', 5, 3, 15, 6.00, '1L bottles');

-- Sample Pending Delivery
INSERT INTO stock_deliveries (delivery_date, supplier, invoice_number, invoice_amount, status, notes, created_by) VALUES
(date('now'), 'Premium Spirits Co', 'INV-2025-001', 1250.00, 'pending', 'Weekly spirits delivery', 4);

-- Delivery Items for pending delivery
INSERT INTO delivery_items (delivery_id, stock_item_id, quantity, unit_cost, expiry_date, batch_number, notes) VALUES
(1, 1, 12, 28.50, date('now', '+730 days'), 'JD-2025-001', 'Jack Daniels - 2 year shelf life'),
(1, 2, 12, 22.00, date('now', '+730 days'), 'ABS-2025-001', 'Absolut Vodka'),
(1, 3, 12, 19.50, date('now', '+730 days'), 'BAC-2025-001', 'Bacardi Rum'),
(1, 4, 12, 26.00, date('now', '+730 days'), 'TAN-2025-001', 'Tanqueray Gin'),
(1, 5, 6, 45.00, date('now', '+730 days'), 'PAT-2025-001', 'Patron Tequila');

-- Sample Accepted Delivery (from yesterday)
INSERT INTO stock_deliveries (delivery_date, supplier, invoice_number, invoice_amount, status, received_by, received_at, notes, created_by) VALUES
(date('now', '-1 day'), 'Fresh Produce Co', 'INV-2025-FP-001', 180.00, 'accepted', 4, datetime('now', '-1 day', '+2 hours'), 'Fresh produce delivery', 4);

-- Delivery Items for accepted delivery
INSERT INTO delivery_items (delivery_id, stock_item_id, quantity, unit_cost, expiry_date, batch_number) VALUES
(2, 16, 5, 4.50, date('now', '+7 days'), 'OJ-2025-W01'),
(2, 17, 4, 5.00, date('now', '+7 days'), 'CRAN-2025-W01'),
(2, 18, 2, 6.00, date('now', '+5 days'), 'LIME-2025-W01'),
(2, 19, 2, 5.50, date('now', '+5 days'), 'LEM-2025-W01'),
(2, 20, 3, 3.00, date('now', '+3 days'), 'MINT-2025-W01');

-- Create batches for accepted delivery
INSERT INTO stock_batches (stock_item_id, delivery_item_id, batch_number, quantity, remaining_quantity, expiry_date, received_date, status) VALUES
(16, 6, 'OJ-2025-W01', 5, 5, date('now', '+7 days'), date('now', '-1 day'), 'active'),
(17, 7, 'CRAN-2025-W01', 4, 4, date('now', '+7 days'), date('now', '-1 day'), 'active'),
(18, 8, 'LIME-2025-W01', 2, 2, date('now', '+5 days'), date('now', '-1 day'), 'active'),
(19, 9, 'LEM-2025-W01', 2, 2, date('now', '+5 days'), date('now', '-1 day'), 'active'),
(20, 10, 'MINT-2025-W01', 3, 3, date('now', '+3 days'), date('now', '-1 day'), 'active');

-- Record transactions for accepted delivery
INSERT INTO stock_transactions (stock_item_id, batch_id, transaction_type, quantity, reference_type, reference_id, notes, performed_by) VALUES
(16, 1, 'delivery', 5, 'delivery', 2, 'Delivery accepted: Fresh Produce Co', 4),
(17, 2, 'delivery', 4, 'delivery', 2, 'Delivery accepted: Fresh Produce Co', 4),
(18, 3, 'delivery', 2, 'delivery', 2, 'Delivery accepted: Fresh Produce Co', 4),
(19, 4, 'delivery', 2, 'delivery', 2, 'Delivery accepted: Fresh Produce Co', 4),
(20, 5, 'delivery', 3, 'delivery', 2, 'Delivery accepted: Fresh Produce Co', 4);

-- Create some stock alerts
INSERT INTO stock_alerts (alert_type, stock_item_id, message, severity) VALUES
('low_stock', 5, 'Patron Silver Tequila is running low (10 bottles remaining)', 'medium'),
('expiring_soon', 20, 'Mint batch expires on ' || date('now', '+3 days'), 'medium');

-- Sample usage transaction (someone used some limes)
INSERT INTO stock_transactions (stock_item_id, batch_id, transaction_type, quantity, reference_type, notes, performed_by) VALUES
(18, 3, 'usage', -0.5, 'manual', 'Used for cocktail service', 3);

-- Update stock quantities to reflect transactions
UPDATE stock_items SET current_quantity = 7.5 WHERE id = 18; -- Limes used