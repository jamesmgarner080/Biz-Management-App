# Business Management Application

A comprehensive web-based business management application designed for hospitality and bar operations. This application provides robust task management, staff scheduling, and operational tracking capabilities.

## Features

### Core Task Management
- **Dual Assignment System**
  - Individual task assignment to specific employees
  - Shift-based task assignment for any staff on duty
- **Task Categories**: Daily Bar Duties, Staff Training, Management Duties, Maintenance, Cleaning, Inventory, Customer Service
- **Priority Levels**: High, Medium, Low
- **Task Status Tracking**: Pending, In Progress, Completed, Overdue
- **Recurring Tasks**: Daily, Weekly, Monthly patterns
- **Task Templates**: Reusable templates for common tasks

### Real-time Features
- **Live Notifications**: Instant updates when tasks are assigned or completed
- **Socket.io Integration**: Real-time synchronization across all connected clients
- **Notification Center**: Centralized notification management

### Reporting & Analytics
- **PDF Report Generation**: Export task reports with filtering options
- **Task Statistics**: Dashboard with completion rates and status overview
- **User Performance Reports**: Individual user activity and completion tracking

### User Management
- **Role-Based Access Control**: Management and Employee roles
- **User Authentication**: Secure JWT-based authentication
- **Password Management**: Change password functionality
- **Active User Management**: Enable/disable user accounts

### Shift Scheduling
- **Shift Management**: Create and manage employee shifts
- **Shift-based Task Assignment**: Automatically assign tasks to on-duty staff
- **Schedule Viewing**: View schedules by date or user

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **PDF Generation**: PDFKit

### Frontend
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with modern design
- **Icons**: Font Awesome 6
- **Real-time**: Socket.io Client

## Installation

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd business-management-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DEFAULT_ADMIN_PASSWORD=your-secure-password
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```
   
   This will create the database and default admin user.

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Default Credentials

**Username**: admin  
**Password**: admin123 (or the password you set in .env)

**⚠️ IMPORTANT**: Change the default password immediately after first login!

## Usage Guide

### For Management Users

#### Creating Tasks

1. Click the "Create Task" button on the dashboard or tasks page
2. Fill in the task details:
   - **Title**: Brief description of the task
   - **Description**: Detailed instructions (optional)
   - **Category**: Select appropriate category
   - **Priority**: High, Medium, or Low
   - **Assignment Type**: Choose between:
     - **Individual**: Assign to a specific employee
     - **Shift-based**: Assign to whoever is on duty on a specific date
   - **Due Date/Time**: When the task should be completed
   - **Recurrence**: Set if task repeats (daily, weekly, monthly)
3. Click "Save Task"

#### Managing Users

1. Navigate to the "Users" section
2. Click "Add User" to create new employee accounts
3. View all users and their status
4. Manage user roles and permissions

#### Generating Reports

1. Go to the "All Tasks" view
2. Click "Export PDF" to generate a comprehensive task report
3. The PDF will open in a new tab and can be saved or printed

### For Employee Users

#### Viewing Tasks

1. Navigate to "My Tasks" to see all assigned tasks
2. Use filters to find specific tasks by status, priority, or category
3. Click on any task to view full details

#### Completing Tasks

1. Click the "Complete" button on a task
2. Add completion notes (optional)
3. Upload a photo as proof of completion (optional)
4. Click "Complete Task"

#### Checking Schedule

1. Navigate to "Schedule" to view your shifts
2. See shift-based tasks assigned to your shift dates

### Notifications

- Real-time notifications appear in the top-right corner
- Click the bell icon to view all notifications
- Unread notifications are highlighted
- Click "Mark All Read" to clear notifications

## Project Structure

```
business-management-app/
├── backend/
│   ├── server.js              # Main server file
│   ├── database.js            # Database manager
│   ├── auth.js                # Authentication middleware
│   ├── routes/
│   │   ├── tasks.js           # Task routes
│   │   ├── users.js           # User routes
│   │   ├── notifications.js   # Notification routes
│   │   ├── schedules.js       # Schedule routes
│   │   └── templates.js       # Template routes
│   └── utils/
│       └── pdf-generator.js   # PDF generation
├── frontend/
│   ├── index.html             # Main app page
│   ├── login.html             # Login page
│   ├── css/
│   │   └── styles.css         # Application styles
│   └── js/
│       ├── auth.js            # Authentication
│       ├── app.js             # Main app logic
│       └── tasks.js           # Task management
├── database/
│   ├── schema.sql             # Database schema
│   └── business_management.db # SQLite database (created on init)
├── uploads/                   # File uploads directory
├── package.json
├── .env                       # Environment variables
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user info
- `POST /api/users/change-password` - Change password

### Tasks
- `GET /api/tasks` - Get all tasks (filtered by role)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task (management only)
- `PUT /api/tasks/:id` - Update task (management only)
- `DELETE /api/tasks/:id` - Delete task (management only)
- `POST /api/tasks/:id/complete` - Mark task as complete
- `GET /api/tasks/date/:date` - Get tasks by date
- `GET /api/tasks/shift/:date` - Get shift tasks for date

### Users
- `GET /api/users` - Get all users (management only)
- `GET /api/users/active` - Get active users
- `POST /api/users` - Create new user (management only)
- `PUT /api/users/:id` - Update user (management only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all as read

### Schedules
- `GET /api/schedules/date/:date` - Get schedules by date
- `GET /api/schedules/user/:userId` - Get user schedules
- `GET /api/schedules/on-duty/:date` - Get users on duty
- `POST /api/schedules` - Create shift schedule (management only)

### Reports
- `POST /api/reports/tasks` - Generate task report PDF
- `GET /api/reports/user/:userId` - Generate user report PDF

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Management vs Employee permissions
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Server-side validation
- **HTTPS Ready**: Production-ready security

## Database Schema

### Users Table
Stores all system users with authentication and profile information.

### Tasks Table
Stores all tasks with support for both individual and shift-based assignments.

### Notifications Table
Tracks all user notifications for real-time updates.

### Shift Schedules Table
Manages employee shift schedules.

### Task Templates Table
Stores reusable task templates.

### Audit Log Table
Tracks important system actions for accountability.

## Future Enhancements

The application is designed to be modular and extensible. Planned future modules include:

- **Inventory Management**: Track bar inventory and supplies
- **Training Program Management**: Structured employee training
- **Performance Analytics**: Advanced reporting and insights
- **Financial Reporting**: Revenue and expense tracking
- **Customer Feedback**: Collect and manage customer reviews
- **Mobile App**: Native mobile applications

## Troubleshooting

### Database Issues
If you encounter database errors:
```bash
# Delete the database and reinitialize
rm database/business_management.db
npm run init-db
```

### Port Already in Use
If port 3000 is already in use, change it in `.env`:
```
PORT=3001
```

### Authentication Errors
If you're getting authentication errors:
1. Clear browser localStorage
2. Try logging in again
3. Check that JWT_SECRET is set in .env

## Support

For issues, questions, or feature requests, please refer to the project documentation or contact the development team.

## License

MIT License - See LICENSE file for details

## Credits

Developed by NinjaTech AI Team