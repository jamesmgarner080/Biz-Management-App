# Quick Start Guide

Get your Business Management Application up and running in 5 minutes!

## Prerequisites

- Node.js 18 or higher installed
- A terminal/command prompt

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including Express, SQLite, Socket.io, and more.

### 2. Set Up Environment

Copy the example environment file:

```bash
cp .env.example .env
```

**Important**: Open `.env` and change the `JWT_SECRET` to a secure random string:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DEFAULT_ADMIN_PASSWORD=admin123
```

### 3. Initialize Database

```bash
npm run init-db
```

This creates the SQLite database with all necessary tables and a default admin user.

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 5. Access the Application

Open your browser and go to:

```
http://localhost:3000
```

## Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123` (or what you set in .env)

**⚠️ Change this password immediately after first login!**

## First Steps After Login

### For Management Users:

1. **Change Your Password**
   - Go to Settings → Change Password
   - Enter current password and new password

2. **Create Employee Accounts**
   - Go to Users → Add User
   - Fill in employee details
   - Assign appropriate role (management or employee)

3. **Create Your First Task**
   - Click "Create Task" button
   - Choose assignment type:
     - **Individual**: Assign to specific person
     - **Shift-based**: Assign to whoever is on duty
   - Fill in task details and save

4. **Set Up Shift Schedules**
   - Go to Schedule → Add Shift
   - Assign employees to specific dates and times

### For Employee Users:

1. **View Your Tasks**
   - Go to "My Tasks"
   - See all tasks assigned to you
   - View shift-based tasks for your scheduled days

2. **Complete Tasks**
   - Click on a task to view details
   - Click "Complete" button
   - Add notes and photos (optional)
   - Submit completion

3. **Check Notifications**
   - Click the bell icon
   - View new task assignments
   - See task completion updates

## Common Tasks

### Creating an Individual Task

1. Click "Create Task"
2. Enter title: "Clean bar area"
3. Select category: "Daily Bar Duties"
4. Set priority: "High"
5. Choose "Assign to Individual"
6. Select employee from dropdown
7. Set due date and time
8. Click "Save Task"

### Creating a Shift-Based Task

1. Click "Create Task"
2. Enter title: "Opening checklist"
3. Select category: "Daily Bar Duties"
4. Set priority: "High"
5. Choose "Assign to Shift/Day"
6. Select the shift date
7. Set due time
8. Click "Save Task"

Now any employee working that day will see this task!

### Generating Reports

1. Go to "All Tasks" (management only)
2. Click "Export PDF"
3. PDF report opens in new tab
4. Save or print as needed

## Troubleshooting

### Port 3000 Already in Use

Change the port in `.env`:
```
PORT=3001
```

Then restart the server.

### Can't Login

1. Make sure the server is running
2. Check browser console for errors
3. Try clearing browser cache/localStorage
4. Verify database was initialized: `npm run init-db`

### Database Errors

Reset the database:
```bash
rm database/business_management.db
npm run init-db
```

### Real-time Updates Not Working

1. Check that Socket.io is connected (check browser console)
2. Refresh the page
3. Make sure firewall isn't blocking WebSocket connections

## Next Steps

- Explore all features in the dashboard
- Create task templates for recurring duties
- Set up your team's shift schedules
- Customize task categories for your business
- Generate reports to track performance

## Need Help?

- Check the full README.md for detailed documentation
- Review the API documentation for integration
- Check the database schema in `database/schema.sql`

## Tips for Success

1. **Use Task Templates**: Create templates for recurring tasks to save time
2. **Set Clear Priorities**: Use High/Medium/Low to help staff prioritize
3. **Add Detailed Descriptions**: Clear instructions prevent confusion
4. **Use Shift-Based Tasks**: Great for opening/closing procedures
5. **Review Reports Regularly**: Track completion rates and identify issues
6. **Enable Notifications**: Keep everyone informed in real-time

Enjoy your Business Management Application! 🎉