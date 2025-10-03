# API Documentation

Complete API reference for the Business Management Application.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

**Endpoint**: `POST /users/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "management",
    "full_name": "System Administrator",
    "email": "admin@example.com"
  }
}
```

## User Endpoints

### Login

**POST** `/users/login`

Authenticate a user and receive a JWT token.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**: `200 OK`
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "role": "string",
    "full_name": "string",
    "email": "string"
  }
}
```

### Get Current User

**GET** `/users/me`

Get information about the currently authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "id": 1,
  "username": "admin",
  "role": "management",
  "full_name": "System Administrator",
  "email": "admin@example.com",
  "phone": null,
  "active": 1
}
```

### Get All Users

**GET** `/users`

Get all users (Management only).

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "management",
    "full_name": "System Administrator",
    "email": "admin@example.com",
    "phone": null,
    "active": 1,
    "created_at": "2024-01-01 00:00:00"
  }
]
```

### Get Active Users

**GET** `/users/active`

Get all active users (for assignment dropdowns).

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "management",
    "full_name": "System Administrator",
    "email": "admin@example.com"
  }
]
```

### Create User

**POST** `/users`

Create a new user (Management only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "secure_password",
  "role": "employee",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123"
}
```

**Response**: `201 Created`
```json
{
  "message": "User created successfully",
  "userId": 2
}
```

### Update User

**PUT** `/users/:id`

Update user information (Management only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "full_name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "555-0124",
  "role": "employee"
}
```

**Response**: `200 OK`
```json
{
  "message": "User updated successfully"
}
```

### Change Password

**POST** `/users/change-password`

Change the current user's password.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response**: `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

## Task Endpoints

### Get All Tasks

**GET** `/tasks`

Get all tasks. Management sees all tasks, employees see only their assigned tasks.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Clean bar area",
    "description": "Complete cleaning of bar area including counters and equipment",
    "category": "Daily Bar Duties",
    "priority": "High",
    "assignment_type": "individual",
    "assigned_to": 2,
    "assigned_to_name": "John Doe",
    "assigned_date": null,
    "due_date": "2024-01-15",
    "due_time": "18:00",
    "status": "pending",
    "recurrence": "none",
    "created_by": 1,
    "created_by_name": "System Administrator",
    "created_at": "2024-01-01 10:00:00",
    "completed_at": null,
    "completed_by": null,
    "completed_by_name": null,
    "completion_notes": null,
    "completion_photo": null
  }
]
```

### Get Task by ID

**GET** `/tasks/:id`

Get a specific task by ID.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Clean bar area",
  "description": "Complete cleaning of bar area",
  "category": "Daily Bar Duties",
  "priority": "High",
  "assignment_type": "individual",
  "assigned_to": 2,
  "assigned_to_name": "John Doe",
  "due_date": "2024-01-15",
  "due_time": "18:00",
  "status": "pending",
  "created_by_name": "System Administrator"
}
```

### Get Tasks by Date

**GET** `/tasks/date/:date`

Get all tasks for a specific date.

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `date`: Date in YYYY-MM-DD format

**Example**: `/tasks/date/2024-01-15`

**Response**: `200 OK` (same format as Get All Tasks)

### Get Shift Tasks

**GET** `/tasks/shift/:date`

Get all shift-based tasks for a specific date.

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `date`: Date in YYYY-MM-DD format

**Example**: `/tasks/shift/2024-01-15`

**Response**: `200 OK` (same format as Get All Tasks)

### Create Task

**POST** `/tasks`

Create a new task (Management only).

**Headers**: `Authorization: Bearer <token>`

**Request Body (Individual Assignment)**:
```json
{
  "title": "Clean bar area",
  "description": "Complete cleaning of bar area including counters",
  "category": "Daily Bar Duties",
  "priority": "High",
  "assignment_type": "individual",
  "assigned_to": 2,
  "due_date": "2024-01-15",
  "due_time": "18:00",
  "recurrence": "none"
}
```

**Request Body (Shift-based Assignment)**:
```json
{
  "title": "Opening checklist",
  "description": "Complete all opening procedures",
  "category": "Daily Bar Duties",
  "priority": "High",
  "assignment_type": "shift-based",
  "assigned_date": "2024-01-15",
  "due_date": "2024-01-15",
  "due_time": "10:00",
  "recurrence": "daily"
}
```

**Response**: `201 Created`
```json
{
  "message": "Task created successfully",
  "taskId": 1
}
```

### Update Task

**PUT** `/tasks/:id`

Update an existing task (Management only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Same as Create Task

**Response**: `200 OK`
```json
{
  "message": "Task updated successfully"
}
```

### Complete Task

**POST** `/tasks/:id/complete`

Mark a task as complete.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Task completed successfully. All areas cleaned.",
  "photo": "/uploads/photo-123456.jpg"
}
```

**Response**: `200 OK`
```json
{
  "message": "Task completed successfully"
}
```

### Update Task Status

**PATCH** `/tasks/:id/status`

Update task status.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "status": "in-progress"
}
```

**Valid statuses**: `pending`, `in-progress`, `completed`, `overdue`

**Response**: `200 OK`
```json
{
  "message": "Task status updated successfully"
}
```

### Delete Task

**DELETE** `/tasks/:id`

Delete a task (Management only).

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

### Get Task Statistics

**GET** `/tasks/stats/overview`

Get task statistics (Management only).

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "total": 50,
  "completed": 30,
  "pending": 15,
  "overdue": 5,
  "byCategory": [
    {
      "category": "Daily Bar Duties",
      "count": 20
    }
  ],
  "byPriority": [
    {
      "priority": "High",
      "count": 15
    }
  ]
}
```

## Notification Endpoints

### Get Notifications

**GET** `/notifications`

Get user notifications.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `unread`: `true` to get only unread notifications

**Example**: `/notifications?unread=true`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 2,
    "task_id": 1,
    "task_title": "Clean bar area",
    "message": "New task assigned: Clean bar area",
    "type": "task_assigned",
    "read": 0,
    "created_at": "2024-01-01 10:00:00"
  }
]
```

### Mark Notification as Read

**PATCH** `/notifications/:id/read`

Mark a specific notification as read.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read

**POST** `/notifications/read-all`

Mark all user notifications as read.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "message": "All notifications marked as read"
}
```

## Schedule Endpoints

### Get Schedules by Date

**GET** `/schedules/date/:date`

Get all shift schedules for a specific date.

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `date`: Date in YYYY-MM-DD format

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 2,
    "full_name": "John Doe",
    "username": "john_doe",
    "shift_date": "2024-01-15",
    "shift_start": "09:00",
    "shift_end": "17:00",
    "role": "bartender",
    "notes": "Morning shift",
    "created_at": "2024-01-01 10:00:00"
  }
]
```

### Get User Schedules

**GET** `/schedules/user/:userId`

Get schedules for a specific user.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Example**: `/schedules/user/2?startDate=2024-01-01&endDate=2024-01-31`

**Response**: `200 OK` (same format as Get Schedules by Date)

### Get Users on Duty

**GET** `/schedules/on-duty/:date`

Get all users scheduled for a specific date.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
[
  {
    "id": 2,
    "username": "john_doe",
    "full_name": "John Doe",
    "role": "employee"
  }
]
```

### Create Shift Schedule

**POST** `/schedules`

Create a new shift schedule (Management only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "user_id": 2,
  "shift_date": "2024-01-15",
  "shift_start": "09:00",
  "shift_end": "17:00",
  "role": "bartender",
  "notes": "Morning shift"
}
```

**Response**: `201 Created`
```json
{
  "message": "Shift schedule created successfully",
  "scheduleId": 1
}
```

## Template Endpoints

### Get All Templates

**GET** `/templates`

Get all task templates.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Daily Opening Checklist",
    "description": "Complete all opening procedures",
    "category": "Daily Bar Duties",
    "priority": "High",
    "estimated_duration": 30,
    "recurrence_pattern": "daily",
    "created_by": 1,
    "created_at": "2024-01-01 10:00:00"
  }
]
```

### Get Template by ID

**GET** `/templates/:id`

Get a specific template.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK` (same format as single template above)

### Create Template

**POST** `/templates`

Create a new task template (Management only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Daily Opening Checklist",
  "description": "Complete all opening procedures",
  "category": "Daily Bar Duties",
  "priority": "High",
  "estimated_duration": 30,
  "recurrence_pattern": "daily"
}
```

**Response**: `201 Created`
```json
{
  "message": "Task template created successfully",
  "templateId": 1
}
```

### Delete Template

**DELETE** `/templates/:id`

Delete a task template (Management only).

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "message": "Task template deleted successfully"
}
```

## Report Endpoints

### Generate Task Report

**POST** `/reports/tasks`

Generate a PDF report of tasks.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "taskIds": [1, 2, 3],
  "filters": {
    "status": "completed",
    "category": "Daily Bar Duties",
    "priority": "High",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31"
  }
}
```

**Response**: `200 OK`
```json
{
  "message": "Report generated successfully",
  "filename": "task-report-1234567890.pdf",
  "path": "/uploads/task-report-1234567890.pdf"
}
```

### Generate User Report

**GET** `/reports/user/:userId`

Generate a PDF report for a specific user.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "message": "Report generated successfully",
  "filename": "user-report-2-1234567890.pdf",
  "path": "/uploads/user-report-2-1234567890.pdf"
}
```

## File Upload Endpoint

### Upload File

**POST** `/upload`

Upload a file (image or PDF).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file`: The file to upload

**Response**: `200 OK`
```json
{
  "message": "File uploaded successfully",
  "filename": "file-1234567890.jpg",
  "path": "/uploads/file-1234567890.jpg"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Management access required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## WebSocket Events

The application uses Socket.io for real-time updates. Connect using:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events Emitted by Server

- `new_task`: New task assigned
- `new_shift_duty`: New shift duty assigned
- `task_completed`: Task marked as complete
- `task_updated`: Task updated
- `task_deleted`: Task deleted
- `task_status_changed`: Task status changed
- `shift_scheduled`: New shift scheduled

### Event Data Format

```javascript
socket.on('new_task', (data) => {
  // data = { taskId, title, priority }
});

socket.on('task_completed', (data) => {
  // data = { taskId, completedBy, title }
});
```

## Rate Limiting

Currently, there are no rate limits implemented. For production use, consider implementing rate limiting using packages like `express-rate-limit`.

## CORS

CORS is enabled for all origins in development. For production, configure the `CORS_ORIGIN` environment variable to restrict access to specific domains.