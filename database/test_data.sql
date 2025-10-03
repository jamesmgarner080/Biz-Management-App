-- ============================================
-- TEST DATA FOR BAR MANAGEMENT SYSTEM
-- ============================================
-- This script creates realistic test data for a bar/hospitality business
-- Including users, tasks, schedules, and assignments

-- First, backup and clear existing data (except admin)
DELETE FROM tasks WHERE id > 0;
DELETE FROM shift_schedules WHERE id > 0;
DELETE FROM user_permissions WHERE user_id > 2;
DELETE FROM notifications WHERE id > 0;
DELETE FROM users WHERE id > 3;

-- ============================================
-- USERS WITH REALISTIC CREDENTIALS
-- ============================================
-- Password for all test users: "password123"
-- Hashed with bcrypt (10 rounds): $2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG

-- ADMIN (already exists - id: 2)
-- Username: admin, Password: admin123

-- MANAGER USERS
INSERT INTO users (username, password_hash, role, full_name, email, phone, active) VALUES
('sarah.manager', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'manager', 'Sarah Mitchell', 'sarah.mitchell@thebar.com', '555-0101', 1),
('james.manager', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'manager', 'James Rodriguez', 'james.rodriguez@thebar.com', '555-0102', 1);

-- SUPERVISOR USERS
INSERT INTO users (username, password_hash, role, full_name, email, phone, active) VALUES
('mike.super', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'supervisor', 'Mike Thompson', 'mike.thompson@thebar.com', '555-0201', 1),
('lisa.super', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'supervisor', 'Lisa Chen', 'lisa.chen@thebar.com', '555-0202', 1);

-- BAR STAFF USERS (including Kerry)
-- Kerry already exists with id: 3
INSERT INTO users (username, password_hash, role, full_name, email, phone, active) VALUES
('tom.bartender', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'bar_staff', 'Tom Anderson', 'tom.anderson@thebar.com', '555-0301', 1),
('emma.bartender', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'bar_staff', 'Emma Davis', 'emma.davis@thebar.com', '555-0302', 1),
('alex.bartender', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'bar_staff', 'Alex Martinez', 'alex.martinez@thebar.com', '555-0303', 1),
('rachel.bartender', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'bar_staff', 'Rachel Kim', 'rachel.kim@thebar.com', '555-0304', 1);

-- CLEANER USERS
INSERT INTO users (username, password_hash, role, full_name, email, phone, active) VALUES
('maria.cleaner', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'cleaner', 'Maria Garcia', 'maria.garcia@thebar.com', '555-0401', 1),
('john.cleaner', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'cleaner', 'John Wilson', 'john.wilson@thebar.com', '555-0402', 1),
('sofia.cleaner', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'cleaner', 'Sofia Lopez', 'sofia.lopez@thebar.com', '555-0403', 1);

-- EMPLOYEE USERS (general staff)
INSERT INTO users (username, password_hash, role, full_name, email, phone, active) VALUES
('david.staff', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'employee', 'David Brown', 'david.brown@thebar.com', '555-0501', 1),
('nina.staff', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'employee', 'Nina Patel', 'nina.patel@thebar.com', '555-0502', 1),
('chris.staff', '$2b$10$sZ0ml5ADv1cso23C38zvC.f0eYFViA6sm56oscb0yeQgxB.AvWShG', 'employee', 'Chris Taylor', 'chris.taylor@thebar.com', '555-0503', 1);

-- ============================================
-- SHIFT SCHEDULES
-- ============================================
-- Create schedules for the next 7 days
INSERT INTO shift_schedules (user_id, shift_date, shift_start, shift_end, role, notes) VALUES
-- Today's shifts
(3, date('now'), '17:00', '01:00', 'bartender', 'Friday night shift'),
(8, date('now'), '17:00', '01:00', 'bartender', 'Friday night shift'),
(9, date('now'), '18:00', '02:00', 'bartender', 'Late night coverage'),
(11, date('now'), '17:00', '23:00', 'cleaner', 'Evening cleaning'),

-- Tomorrow's shifts
(4, date('now', '+1 day'), '11:00', '19:00', 'manager', 'Saturday day shift'),
(7, date('now', '+1 day'), '11:00', '19:00', 'bartender', 'Saturday day shift'),
(10, date('now', '+1 day'), '19:00', '03:00', 'bartender', 'Saturday night shift'),
(8, date('now', '+1 day'), '19:00', '03:00', 'bartender', 'Saturday night shift'),
(12, date('now', '+1 day'), '23:00', '07:00', 'cleaner', 'Deep cleaning'),

-- Day after tomorrow
(3, date('now', '+2 day'), '12:00', '20:00', 'bartender', 'Sunday brunch shift'),
(9, date('now', '+2 day'), '12:00', '20:00', 'bartender', 'Sunday brunch shift'),
(13, date('now', '+2 day'), '10:00', '18:00', 'cleaner', 'Sunday cleaning'),

-- Next week Monday
(4, date('now', '+3 day'), '10:00', '18:00', 'manager', 'Monday opening'),
(7, date('now', '+3 day'), '17:00', '01:00', 'bartender', 'Monday evening'),
(11, date('now', '+3 day'), '09:00', '17:00', 'cleaner', 'Monday cleaning'),

-- Next week Tuesday
(8, date('now', '+4 day'), '11:00', '19:00', 'bartender', 'Tuesday day'),
(10, date('now', '+4 day'), '18:00', '02:00', 'bartender', 'Tuesday night'),
(12, date('now', '+4 day'), '10:00', '18:00', 'cleaner', 'Tuesday cleaning');

-- ============================================
-- TASKS - OPENING PROCEDURES (Individual Assignments)
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_to, created_by, due_date, due_time) VALUES
('Open Bar - Stock Check', 'Check all liquor bottles, beer kegs, wine inventory. Note any items running low. Update inventory sheet.', 'High', 'pending', 'Inventory', 'individual', 3, 4, date('now'), '10:00'),
('Open Bar - Glassware Prep', 'Ensure all glassware is clean, polished, and properly stocked. Check for chips or cracks.', 'High', 'pending', 'Daily Bar Duties', 'individual', 7, 4, date('now'), '10:30'),
('Open Bar - Ice Machine', 'Fill ice bins, check ice machine operation, clean ice scoops and bins.', 'High', 'pending', 'Daily Bar Duties', 'individual', 8, 4, date('now'), '10:15'),
('Open Bar - POS System', 'Boot up POS system, verify cash drawer, print opening report, check receipt paper.', 'High', 'pending', 'Management Duties', 'individual', 4, 4, date('now'), '09:45'),
('Open Bar - Bar Setup', 'Set up garnish station, cut fruit, prepare syrups, stock straws and napkins.', 'Medium', 'pending', 'Daily Bar Duties', 'individual', 3, 4, date('now'), '10:45'),
('Open Bar - Music & Ambiance', 'Test sound system, set appropriate playlist, adjust lighting, check temperature.', 'Low', 'pending', 'Daily Bar Duties', 'individual', 7, 4, date('now'), '11:00');

-- ============================================
-- TASKS - CLOSING PROCEDURES (Shift-based for today)
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_date, created_by, due_date, due_time) VALUES
('Close Bar - Cash Reconciliation', 'Count cash drawer, reconcile with POS reports, prepare bank deposit, complete closing paperwork.', 'High', 'pending', 'Management Duties', 'shift-based', date('now'), 4, date('now'), '02:00'),
('Close Bar - Liquor Inventory', 'Count all open bottles, update inventory system, note any discrepancies, secure liquor room.', 'High', 'pending', 'Inventory', 'shift-based', date('now'), 4, date('now'), '01:45'),
('Close Bar - Clean Bar Top', 'Wipe down entire bar surface, clean speed rails, sanitize cutting boards, clean sinks.', 'High', 'pending', 'Cleaning', 'shift-based', date('now'), 4, date('now'), '01:30'),
('Close Bar - Glassware', 'Wash all remaining glassware, run final dishwasher cycle, put away clean glasses.', 'Medium', 'pending', 'Daily Bar Duties', 'shift-based', date('now'), 4, date('now'), '01:15'),
('Close Bar - Floor Cleaning', 'Sweep and mop behind bar, clean bar mats, take out trash, replace trash bags.', 'Medium', 'pending', 'Cleaning', 'shift-based', date('now'), 4, date('now'), '01:45'),
('Close Bar - Security Check', 'Lock all doors and windows, set alarm system, turn off unnecessary lights, final walkthrough.', 'High', 'pending', 'Management Duties', 'shift-based', date('now'), 4, date('now'), '02:00');

-- ============================================
-- TASKS - MAINTENANCE
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_to, created_by, due_date, due_time) VALUES
('Weekly - Beer Line Cleaning', 'Clean all beer lines with approved cleaning solution. Flush thoroughly. Test beer quality.', 'High', 'pending', 'Maintenance', 'individual', 8, 5, date('now', '+1 day'), '14:00'),
('Weekly - Deep Clean Draft System', 'Disassemble and clean all draft beer faucets, check for mold, sanitize components.', 'High', 'pending', 'Maintenance', 'individual', 7, 5, date('now', '+1 day'), '15:00'),
('Monthly - Equipment Inspection', 'Inspect ice machine, refrigeration units, dishwasher. Check for leaks, unusual sounds, or issues.', 'Medium', 'pending', 'Maintenance', 'individual', 5, 5, date('now', '+7 days'), '10:00'),
('Check Bar Equipment', 'Test blenders, shakers, jiggers. Replace any damaged equipment. Sharpen bar knives.', 'Medium', 'pending', 'Maintenance', 'individual', 6, 5, date('now', '+2 days'), '11:00');

-- ============================================
-- TASKS - INVENTORY & ORDERING
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_to, created_by, due_date, due_time) VALUES
('Weekly Liquor Order', 'Review inventory levels, check par levels, place order with distributor. Focus on weekend needs.', 'High', 'pending', 'Inventory', 'individual', 4, 4, date('now', '+1 day'), '12:00'),
('Beer & Wine Restock', 'Count beer kegs and wine bottles. Order replacements for popular items. Check expiration dates.', 'High', 'pending', 'Inventory', 'individual', 5, 4, date('now', '+1 day'), '13:00'),
('Bar Supplies Order', 'Order straws, napkins, coasters, stir sticks, garnishes. Check cleaning supplies inventory.', 'Medium', 'pending', 'Inventory', 'individual', 6, 4, date('now', '+2 days'), '11:00'),
('Receive & Stock Delivery', 'Check delivery against invoice, inspect for damage, stock items properly, update inventory system.', 'High', 'pending', 'Inventory', 'individual', 8, 4, date('now', '+3 days'), '10:00');

-- ============================================
-- TASKS - CLEANING (DEEP CLEANING)
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_to, created_by, due_date, due_time) VALUES
('Deep Clean Restrooms', 'Scrub toilets, sinks, floors. Refill supplies. Check for maintenance issues. Sanitize all surfaces.', 'High', 'pending', 'Cleaning', 'individual', 11, 6, date('now'), '14:00'),
('Clean Bar Seating Area', 'Wipe down all tables and chairs, clean booth seats, vacuum upholstery, spot clean stains.', 'High', 'pending', 'Cleaning', 'individual', 12, 6, date('now'), '15:00'),
('Kitchen Area Cleaning', 'Clean prep areas, sanitize cutting boards, degrease surfaces, clean appliances, mop floors.', 'High', 'pending', 'Cleaning', 'individual', 13, 6, date('now'), '16:00'),
('Windows & Mirrors', 'Clean all windows inside and out, clean mirrors, wipe down window sills and frames.', 'Medium', 'pending', 'Cleaning', 'individual', 11, 6, date('now', '+1 day'), '13:00'),
('Storage Area Organization', 'Organize storage rooms, check for expired items, clean shelves, ensure proper rotation.', 'Medium', 'pending', 'Cleaning', 'individual', 12, 6, date('now', '+2 days'), '14:00');

-- ============================================
-- TASKS - CUSTOMER SERVICE & TRAINING
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_to, created_by, due_date, due_time) VALUES
('Update Drink Menu', 'Create new seasonal cocktail menu, print menus, train staff on new drinks, update POS system.', 'Medium', 'pending', 'Customer Service', 'individual', 4, 4, date('now', '+3 days'), '15:00'),
('Staff Training - New Cocktails', 'Train all bartenders on 3 new signature cocktails. Practice recipes and presentation.', 'Medium', 'pending', 'Staff Training', 'individual', 5, 4, date('now', '+4 days'), '16:00'),
('Happy Hour Prep', 'Set up happy hour specials in POS, create table tents, brief staff on promotions.', 'Medium', 'pending', 'Customer Service', 'individual', 6, 5, date('now'), '15:00');

-- ============================================
-- COMPLETED TASKS (for history/reporting)
-- ============================================
INSERT INTO tasks (title, description, priority, status, category, assignment_type, assigned_to, created_by, completed_by, due_date, completed_at) VALUES
('Yesterday - Opening Stock Check', 'Completed morning stock check. All items at good levels.', 'High', 'completed', 'Inventory', 'individual', 3, 4, 3, date('now', '-1 day'), datetime('now', '-1 day', '+2 hours')),
('Yesterday - Close Bar Cleaning', 'Bar cleaned and secured for the night.', 'High', 'completed', 'Cleaning', 'shift-based', NULL, 4, 8, date('now', '-1 day'), datetime('now', '-1 day', '+10 hours')),
('Yesterday - Restroom Cleaning', 'All restrooms cleaned and restocked.', 'High', 'completed', 'Cleaning', 'individual', 11, 6, 11, date('now', '-1 day'), datetime('now', '-1 day', '+6 hours')),
('Last Week - Beer Line Cleaning', 'All beer lines cleaned and tested. Quality good.', 'High', 'completed', 'Maintenance', 'individual', 7, 5, 7, date('now', '-7 days'), datetime('now', '-7 days', '+3 hours')),
('Last Week - Liquor Order', 'Weekly liquor order placed and received.', 'High', 'completed', 'Inventory', 'individual', 4, 4, 4, date('now', '-5 days'), datetime('now', '-5 days', '+2 hours'));

-- ============================================
-- SUMMARY
-- ============================================
-- Total Users: 16 (1 admin, 2 managers, 2 supervisors, 5 bar staff, 3 cleaners, 3 employees)
-- Total Active Tasks: 28 (6 opening, 6 closing, 4 maintenance, 4 inventory, 5 cleaning, 3 customer service)
-- Total Completed Tasks: 5
-- Total Shift Schedules: 15
-- All passwords: "password123" (except admin: "admin123")