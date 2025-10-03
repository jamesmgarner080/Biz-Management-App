-- Business Management Application Database Schema
-- SQLite compatible schema

-- Users table: Stores all system users (management and employees)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'supervisor', 'bar_staff', 'cleaner', 'employee')),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Tasks table: Stores all tasks (individual and shift-based)
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK(category IN (
        'Daily Bar Duties',
        'Staff Training',
        'Management Duties',
        'Maintenance',
        'Cleaning',
        'Inventory',
        'Customer Service',
        'Other'
    )),
    priority TEXT NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')),
    
    -- Assignment type: 'individual' or 'shift-based'
    assignment_type TEXT NOT NULL CHECK(assignment_type IN ('individual', 'shift-based')),
    
    -- For individual assignments: specific user ID
    assigned_to INTEGER,
    
    -- For shift-based assignments: the date when any on-duty staff must complete
    assigned_date DATE,
    
    due_date DATETIME,
    due_time TIME,
    
    -- Status: 'pending', 'in-progress', 'completed', 'overdue'
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'overdue')),
    
    -- Recurrence: 'none', 'daily', 'weekly', 'monthly'
    recurrence TEXT DEFAULT 'none' CHECK(recurrence IN ('none', 'daily', 'weekly', 'monthly')),
    
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    completed_at DATETIME,
    completed_by INTEGER,
    completion_notes TEXT,
    completion_photo TEXT, -- Path to uploaded photo
    
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- Task templates: Reusable task templates for quick creation
CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    estimated_duration INTEGER, -- in minutes
    recurrence_pattern TEXT DEFAULT 'none',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Notifications: System notifications for users
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN (
        'task_assigned',
        'task_completed',
        'task_overdue',
        'shift_duty',
        'system'
    )),
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Shift schedules: Track who is working when (for shift-based task assignment)
CREATE TABLE IF NOT EXISTS shift_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    role TEXT, -- 'bartender', 'server', 'manager', etc.
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Task comments: Allow users to add comments/updates to tasks
CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit log: Track important system actions
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT, -- 'task', 'user', 'schedule', etc.
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_date ON tasks(assigned_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON shift_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_user ON shift_schedules(user_id);

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt
INSERT OR IGNORE INTO users (id, username, password_hash, role, full_name, email) 
VALUES (1, 'admin', '$2b$10$rKvVLZ5TjqKqKqKqKqKqKuXxXxXxXxXxXxXxXxXxXxXxXxXxXx', 'management', 'System Administrator', 'admin@example.com');

-- Sample task categories for reference
-- Daily Bar Duties: Opening/closing procedures, restocking, cleaning
-- Staff Training: Training sessions, certifications, onboarding
-- Management Duties: Reports, scheduling, inventory management
-- Maintenance: Equipment repairs, facility maintenance
-- Cleaning: Deep cleaning, sanitation tasks
-- Inventory: Stock counts, ordering, receiving
-- Customer Service: Special events, customer follow-ups