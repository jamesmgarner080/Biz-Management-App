require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Import modules
const DatabaseManager = require('./database');
const { authenticateToken } = require('./auth');
const createUserRoutes = require('./routes/users');
const createTaskRoutes = require('./routes/tasks');
const createNotificationRoutes = require('./routes/notifications');
const createScheduleRoutes = require('./routes/schedules');
const createTemplateRoutes = require('./routes/templates');
const createPermissionRoutes = require('./routes/permissions');
const PDFGenerator = require('./utils/pdf-generator');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// Initialize database
const db = new DatabaseManager();
const pdfGenerator = new PDFGenerator(db);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make database available to routes
app.set('db', db);

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});

// Serve static files
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/users', createUserRoutes(db));
app.use('/api/tasks', createTaskRoutes(db, io));
app.use('/api/notifications', createNotificationRoutes(db, io));
app.use('/api/schedules', createScheduleRoutes(db, io));
app.use('/api/templates', createTemplateRoutes(db));
app.use('/api/permissions', createPermissionRoutes(db));
app.use('/api/stock', require('./routes/stock')(db));

// File upload endpoint
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        res.json({
            message: 'File uploaded successfully',
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// PDF Report generation endpoint
app.post('/api/reports/tasks', authenticateToken, async (req, res) => {
    try {
        const { taskIds, filters } = req.body;
        
        let tasks;
        if (taskIds && taskIds.length > 0) {
            tasks = taskIds.map(id => db.getTaskById(id)).filter(t => t);
        } else {
            tasks = db.getAllTasks();
        }
        
        // Apply filters
        if (filters) {
            if (filters.status) {
                tasks = tasks.filter(t => t.status === filters.status);
            }
            if (filters.category) {
                tasks = tasks.filter(t => t.category === filters.category);
            }
            if (filters.priority) {
                tasks = tasks.filter(t => t.priority === filters.priority);
            }
            if (filters.dateFrom) {
                tasks = tasks.filter(t => t.due_date >= filters.dateFrom);
            }
            if (filters.dateTo) {
                tasks = tasks.filter(t => t.due_date <= filters.dateTo);
            }
        }
        
        const filename = `task-report-${Date.now()}.pdf`;
        const outputPath = path.join(uploadDir, filename);
        
        await pdfGenerator.generateTaskReport(tasks, filters, outputPath);
        
        res.json({
            message: 'Report generated successfully',
            filename: filename,
            path: `/uploads/${filename}`
        });
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// User report endpoint
app.get('/api/reports/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { dateFrom, dateTo } = req.query;
        
        // Check permissions
        if (!['admin', 'manager'].includes(req.user.role) && parseInt(userId) !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const user = db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = dateTo || new Date().toISOString().split('T')[0];
        
        const tasks = db.getTasksByUser(userId);
        const schedules = db.getShiftSchedulesByUser(userId, startDate, endDate);
        
        const filename = `user-report-${userId}-${Date.now()}.pdf`;
        const outputPath = path.join(uploadDir, filename);
        
        await pdfGenerator.generateUserReport(user, tasks, schedules, outputPath);
        
        res.json({
            message: 'Report generated successfully',
            filename: filename,
            path: `/uploads/${filename}`
        });
    } catch (error) {
        console.error('User report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Summary report endpoint
app.post('/api/reports/summary', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Management access required' });
        }
        
        const { dateFrom, dateTo, includeUserStats, includeCategoryBreakdown } = req.body;
        
        let tasks = db.getAllTasks();
        
        // Apply date filters
        if (dateFrom) {
            tasks = tasks.filter(t => t.due_date >= dateFrom);
        }
        if (dateTo) {
            tasks = tasks.filter(t => t.due_date <= dateTo);
        }
        
        const filename = `summary-report-${Date.now()}.pdf`;
        const outputPath = path.join(uploadDir, filename);
        
        await pdfGenerator.generateSummaryReport(
            tasks, 
            db.getAllUsers(), 
            { dateFrom, dateTo, includeUserStats, includeCategoryBreakdown },
            outputPath
        );
        
        res.json({
            message: 'Report generated successfully',
            filename: filename,
            path: `/uploads/${filename}`
        });
    } catch (error) {
        console.error('Summary report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error'));
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user-specific room
    socket.join(`user_${socket.userId}`);
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
    
    // Handle task status updates
    socket.on('update_task_status', (data) => {
        io.emit('task_status_changed', data);
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DATABASE_PATH || './database/business_management.db'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        db.close();
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    server.close(() => {
        db.close();
        console.log('Server closed');
        process.exit(0);
    });
});