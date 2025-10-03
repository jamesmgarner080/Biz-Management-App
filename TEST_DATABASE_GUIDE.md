# Test Database Guide

## Overview
A comprehensive test database has been created with realistic data for a bar/hospitality business. This includes 16 users across different roles, 33 tasks (28 active + 5 completed), and 18 shift schedules.

## Test User Credentials

### Admin Access
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Administrator
- **Permissions:** Full system access

### Manager Accounts
| Username | Password | Full Name | Role |
|----------|----------|-----------|------|
| sarah.manager | password123 | Sarah Mitchell | Manager |
| james.manager | password123 | James Rodriguez | Manager |

**Manager Permissions:**
- Create, edit, delete tasks
- Manage users and schedules
- Generate reports
- View all tasks
- Assign tasks to staff

### Supervisor Accounts
| Username | Password | Full Name | Role |
|----------|----------|-----------|------|
| mike.super | password123 | Mike Thompson | Supervisor |
| lisa.super | password123 | Lisa Chen | Supervisor |

**Supervisor Permissions:**
- Create and edit tasks
- View reports
- Manage schedules
- View all tasks

### Bar Staff Accounts
| Username | Password | Full Name | Role |
|----------|----------|-----------|------|
| Kerry | password123 | Kerry Young | Bar Staff |
| tom.bartender | password123 | Tom Anderson | Bar Staff |
| emma.bartender | password123 | Emma Davis | Bar Staff |
| alex.bartender | password123 | Alex Martinez | Bar Staff |
| rachel.bartender | password123 | Rachel Kim | Bar Staff |

**Bar Staff Permissions:**
- View assigned tasks
- Complete tasks
- Add completion notes
- View their schedule

### Cleaner Accounts
| Username | Password | Full Name | Role |
|----------|----------|-----------|------|
| maria.cleaner | password123 | Maria Garcia | Cleaner |
| john.cleaner | password123 | John Wilson | Cleaner |
| sofia.cleaner | password123 | Sofia Lopez | Cleaner |

**Cleaner Permissions:**
- View assigned cleaning tasks
- Complete tasks
- View their schedule

### Employee Accounts
| Username | Password | Full Name | Role |
|----------|----------|-----------|------|
| david.staff | password123 | David Brown | Employee |
| nina.staff | password123 | Nina Patel | Employee |
| chris.staff | password123 | Chris Taylor | Employee |

**Employee Permissions:**
- View assigned tasks
- Complete basic tasks
- View their schedule

## Test Data Summary

### Tasks Breakdown (33 Total)

#### Opening Tasks (6)
- Stock Check (assigned to Kerry)
- Glassware Prep (assigned to Emma)
- Ice Machine (assigned to Tom)
- POS System (assigned to Sarah)
- Bar Setup (assigned to Kerry)
- Music & Ambiance (assigned to Emma)

#### Closing Tasks (6 - Shift-based)
- Cash Reconciliation
- Liquor Inventory
- Clean Bar Top
- Glassware
- Floor Cleaning
- Security Check

#### Maintenance Tasks (4)
- Weekly Beer Line Cleaning (assigned to Tom)
- Deep Clean Draft System (assigned to Emma)
- Monthly Equipment Inspection (assigned to James)
- Check Bar Equipment (assigned to Mike)

#### Inventory Tasks (4)
- Weekly Liquor Order (assigned to Sarah)
- Beer & Wine Restock (assigned to James)
- Bar Supplies Order (assigned to Mike)
- Receive & Stock Delivery (assigned to Tom)

#### Cleaning Tasks (5)
- Deep Clean Restrooms (assigned to Maria)
- Clean Bar Seating Area (assigned to John)
- Kitchen Area Cleaning (assigned to Sofia)
- Windows & Mirrors (assigned to Maria)
- Storage Area Organization (assigned to John)

#### Customer Service Tasks (3)
- Update Drink Menu (assigned to Sarah)
- Staff Training - New Cocktails (assigned to James)
- Happy Hour Prep (assigned to Mike)

#### Completed Tasks (5)
- Yesterday - Opening Stock Check (completed by Kerry)
- Yesterday - Close Bar Cleaning (completed by Tom)
- Yesterday - Restroom Cleaning (completed by Maria)
- Last Week - Beer Line Cleaning (completed by Emma)
- Last Week - Liquor Order (completed by Sarah)

### Shift Schedules (18 Total)

#### Today's Shifts
- Kerry Young (17:00-01:00) - Bartender
- Tom Anderson (17:00-01:00) - Bartender
- Alex Martinez (18:00-02:00) - Bartender
- Maria Garcia (17:00-23:00) - Cleaner

#### Tomorrow's Shifts
- Sarah Mitchell (11:00-19:00) - Manager
- Emma Davis (11:00-19:00) - Bartender
- Rachel Kim (19:00-03:00) - Bartender
- Tom Anderson (19:00-03:00) - Bartender
- John Wilson (23:00-07:00) - Cleaner

#### Future Shifts
- Multiple shifts scheduled for the next 7 days
- Covers day, evening, and night shifts
- Includes weekend coverage

## Testing Scenarios

### 1. Role-Based Access Testing
**Test as Admin:**
- Login as `admin` / `admin123`
- Verify access to all navigation items
- Create a new user with custom permissions
- Edit Kerry's role (change and change back)
- Create, edit, and delete tasks
- Generate all report types

**Test as Manager:**
- Login as `sarah.manager` / `password123`
- Verify can create and assign tasks
- Check user management access
- Generate reports
- View all tasks

**Test as Bar Staff:**
- Login as `Kerry` / `password123`
- Verify can only see assigned tasks
- Complete a task
- Check cannot access user management
- View personal schedule

### 2. Task Management Testing
**Individual Tasks:**
- View tasks assigned to specific users
- Complete tasks and add notes
- Check task status updates
- Verify notifications

**Shift-Based Tasks:**
- View tasks assigned to today's shift
- Complete shift-based tasks
- Verify any on-duty staff can complete

### 3. Schedule Testing
- View schedule for different users
- Check shift times and roles
- Verify schedule displays correctly
- Test date filtering

### 4. Permission Testing
**Test Permission Changes:**
- Login as admin
- Edit a user (e.g., Kerry)
- Add/remove custom permissions
- Logout and login as that user
- Verify permission changes take effect

### 5. Reporting Testing
- Generate Task Reports (filter by status, category, date)
- Generate User Performance Reports
- Generate Summary Reports
- Verify PDF downloads work
- Check data accuracy

### 6. Real-Time Features
- Open two browser windows
- Login as different users
- Assign a task in one window
- Verify notification appears in other window
- Test task completion notifications

## Database Files

### Main Database
- **Location:** `database/business_management.db`
- **Backup:** `database/business_management.db.backup`

### Test Data Script
- **Location:** `database/test_data.sql`
- **Purpose:** Recreate test data anytime

### Restoring Test Data
To reset the database to test data:
```bash
cd /workspace
sqlite3 database/business_management.db < database/test_data.sql
```

## Important Notes

1. **Kerry's Role Fixed:** Kerry Young now has the correct role of "bar_staff" (was incorrectly set to admin)

2. **Role Editing:** All user roles can be edited by users with appropriate permissions (admin, manager)

3. **Password Security:** All test users use "password123" for easy testing. In production, enforce strong passwords.

4. **Realistic Data:** Tasks and schedules reflect actual bar/hospitality operations for authentic testing

5. **Task Categories:** Tasks use the system's predefined categories:
   - Daily Bar Duties
   - Staff Training
   - Management Duties
   - Maintenance
   - Cleaning
   - Inventory
   - Customer Service
   - Other

6. **Priority Levels:** Tasks use High, Medium, Low priorities (note: system uses capitalized values)

7. **Assignment Types:** 
   - Individual: Assigned to specific user
   - Shift-based: Any on-duty staff can complete

## Next Steps

1. **Restart the server** to ensure all changes are loaded
2. **Test login** with different user accounts
3. **Verify role-based permissions** work correctly
4. **Test task management** features
5. **Generate reports** to verify data
6. **Test real-time notifications**

## Support

If you encounter any issues:
1. Check the server logs for errors
2. Verify database connection
3. Ensure all users can login
4. Test with admin account first
5. Verify task assignments display correctly

---

**Database Version:** 2.2  
**Last Updated:** 2025-10-02  
**Total Test Users:** 16  
**Total Test Tasks:** 33  
**Total Schedules:** 18