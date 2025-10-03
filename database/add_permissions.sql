-- Add permissions table for feature-based access control
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL,
    granted_by INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE(user_id, permission)
);

-- Role permissions table for default role-based permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission)
);

-- Insert default role permissions
-- Admin has all permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('admin', 'view_all_tasks'),
('admin', 'create_tasks'),
('admin', 'edit_tasks'),
('admin', 'delete_tasks'),
('admin', 'assign_tasks'),
('admin', 'complete_tasks'),
('admin', 'view_all_users'),
('admin', 'create_users'),
('admin', 'edit_users'),
('admin', 'delete_users'),
('admin', 'manage_permissions'),
('admin', 'view_schedules'),
('admin', 'create_schedules'),
('admin', 'edit_schedules'),
('admin', 'delete_schedules'),
('admin', 'generate_reports'),
('admin', 'view_analytics'),
('admin', 'manage_templates');

-- Manager permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('manager', 'view_all_tasks'),
('manager', 'create_tasks'),
('manager', 'edit_tasks'),
('manager', 'assign_tasks'),
('manager', 'complete_tasks'),
('manager', 'view_all_users'),
('manager', 'view_schedules'),
('manager', 'create_schedules'),
('manager', 'edit_schedules'),
('manager', 'generate_reports'),
('manager', 'view_analytics');

-- Supervisor permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('supervisor', 'view_all_tasks'),
('supervisor', 'create_tasks'),
('supervisor', 'assign_tasks'),
('supervisor', 'complete_tasks'),
('supervisor', 'view_schedules'),
('supervisor', 'generate_reports');

-- Bar Staff permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('bar_staff', 'view_my_tasks'),
('bar_staff', 'complete_tasks'),
('bar_staff', 'view_my_schedule');

-- Cleaner permissions
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('cleaner', 'view_my_tasks'),
('cleaner', 'complete_tasks'),
('cleaner', 'view_my_schedule');

-- Employee permissions (general)
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
('employee', 'view_my_tasks'),
('employee', 'complete_tasks'),
('employee', 'view_my_schedule');

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);