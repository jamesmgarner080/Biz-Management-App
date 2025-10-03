const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    constructor(db) {
        this.db = db;
    }
    
    generateTaskReport(tasks, filters, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(outputPath);
                
                doc.pipe(stream);
                
                // Header
                doc.fontSize(20).text('Task Report', { align: 'center' });
                doc.moveDown();
                
                // Report metadata
                doc.fontSize(10);
                doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
                doc.text(`Total Tasks: ${tasks.length}`, { align: 'right' });
                doc.moveDown();
                
                // Filters applied
                if (filters && Object.keys(filters).length > 0) {
                    doc.fontSize(12).text('Filters Applied:', { underline: true });
                    doc.fontSize(10);
                    if (filters.status) doc.text(`Status: ${filters.status}`);
                    if (filters.category) doc.text(`Category: ${filters.category}`);
                    if (filters.priority) doc.text(`Priority: ${filters.priority}`);
                    if (filters.dateFrom) doc.text(`Date From: ${filters.dateFrom}`);
                    if (filters.dateTo) doc.text(`Date To: ${filters.dateTo}`);
                    doc.moveDown();
                }
                
                // Tasks
                doc.fontSize(14).text('Tasks', { underline: true });
                doc.moveDown();
                
                tasks.forEach((task, index) => {
                    // Check if we need a new page
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                    
                    doc.fontSize(12).text(`${index + 1}. ${task.title}`, { bold: true });
                    doc.fontSize(10);
                    
                    if (task.description) {
                        doc.text(`Description: ${task.description}`);
                    }
                    
                    doc.text(`Category: ${task.category}`);
                    doc.text(`Priority: ${task.priority}`);
                    doc.text(`Status: ${task.status}`);
                    
                    if (task.assignment_type === 'individual' && task.assigned_to_name) {
                        doc.text(`Assigned To: ${task.assigned_to_name}`);
                    } else if (task.assignment_type === 'shift-based' && task.assigned_date) {
                        doc.text(`Shift Date: ${task.assigned_date}`);
                    }
                    
                    if (task.due_date) {
                        doc.text(`Due Date: ${task.due_date}${task.due_time ? ' ' + task.due_time : ''}`);
                    }
                    
                    if (task.status === 'completed') {
                        doc.text(`Completed By: ${task.completed_by_name || 'Unknown'}`);
                        doc.text(`Completed At: ${task.completed_at}`);
                        if (task.completion_notes) {
                            doc.text(`Notes: ${task.completion_notes}`);
                        }
                    }
                    
                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                    doc.moveDown();
                });
                
                // Footer
                const pages = doc.bufferedPageRange();
                for (let i = 0; i < pages.count; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8).text(
                        `Page ${i + 1} of ${pages.count}`,
                        50,
                        doc.page.height - 50,
                        { align: 'center' }
                    );
                }
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(outputPath);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    generateUserReport(user, tasks, schedules, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(outputPath);
                
                doc.pipe(stream);
                
                // Header
                doc.fontSize(20).text('User Performance Report', { align: 'center' });
                doc.moveDown();
                
                // User info
                doc.fontSize(14).text('User Information', { underline: true });
                doc.fontSize(10);
                doc.text(`Name: ${user.full_name}`);
                doc.text(`Username: ${user.username}`);
                doc.text(`Role: ${user.role}`);
                doc.text(`Email: ${user.email || 'N/A'}`);
                doc.moveDown();
                
                // Task statistics
                doc.fontSize(14).text('Task Statistics', { underline: true });
                doc.fontSize(10);
                
                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                const pendingTasks = tasks.filter(t => t.status === 'pending').length;
                const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
                
                doc.text(`Total Tasks: ${tasks.length}`);
                doc.text(`Completed: ${completedTasks}`);
                doc.text(`Pending: ${pendingTasks}`);
                doc.text(`Overdue: ${overdueTasks}`);
                doc.text(`Completion Rate: ${tasks.length > 0 ? ((completedTasks / tasks.length) * 100).toFixed(1) : 0}%`);
                doc.moveDown();
                
                // Recent tasks
                doc.fontSize(14).text('Recent Tasks', { underline: true });
                doc.moveDown();
                
                tasks.slice(0, 10).forEach((task, index) => {
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                    
                    doc.fontSize(11).text(`${index + 1}. ${task.title}`);
                    doc.fontSize(9);
                    doc.text(`Status: ${task.status} | Priority: ${task.priority} | Category: ${task.category}`);
                    if (task.status === 'completed' && task.completed_at) {
                        doc.text(`Completed: ${task.completed_at}`);
                    }
                    doc.moveDown(0.5);
                });
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(outputPath);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    generateSummaryReport(tasks, users, options, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(outputPath);
                
                doc.pipe(stream);
                
                // Header
                doc.fontSize(20).text('Business Summary Report', { align: 'center' });
                doc.moveDown();
                
                // Report metadata
                doc.fontSize(10);
                doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
                if (options.dateFrom || options.dateTo) {
                    doc.text(`Period: ${options.dateFrom || 'Start'} to ${options.dateTo || 'End'}`, { align: 'right' });
                }
                doc.moveDown();
                
                // Overall Statistics
                doc.fontSize(16).text('Overall Statistics', { underline: true });
                doc.fontSize(10);
                doc.moveDown(0.5);
                
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                const pendingTasks = tasks.filter(t => t.status === 'pending').length;
                const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
                const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
                
                doc.text(`Total Tasks: ${totalTasks}`);
                doc.text(`Completed: ${completedTasks} (${totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0}%)`);
                doc.text(`Pending: ${pendingTasks}`);
                doc.text(`In Progress: ${inProgressTasks}`);
                doc.text(`Overdue: ${overdueTasks}`);
                doc.text(`Active Users: ${users.filter(u => u.active).length}`);
                doc.moveDown();
                
                // Category Breakdown
                if (options.includeCategoryBreakdown) {
                    doc.fontSize(16).text('Tasks by Category', { underline: true });
                    doc.fontSize(10);
                    doc.moveDown(0.5);
                    
                    const categories = {};
                    tasks.forEach(task => {
                        if (!categories[task.category]) {
                            categories[task.category] = { total: 0, completed: 0 };
                        }
                        categories[task.category].total++;
                        if (task.status === 'completed') {
                            categories[task.category].completed++;
                        }
                    });
                    
                    Object.keys(categories).sort().forEach(category => {
                        const stats = categories[category];
                        const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
                        doc.text(`${category}: ${stats.total} tasks (${stats.completed} completed, ${completionRate}% completion rate)`);
                    });
                    doc.moveDown();
                }
                
                // Priority Breakdown
                doc.fontSize(16).text('Tasks by Priority', { underline: true });
                doc.fontSize(10);
                doc.moveDown(0.5);
                
                const priorities = { High: 0, Medium: 0, Low: 0 };
                tasks.forEach(task => {
                    if (priorities[task.priority] !== undefined) {
                        priorities[task.priority]++;
                    }
                });
                
                Object.keys(priorities).forEach(priority => {
                    doc.text(`${priority}: ${priorities[priority]} tasks`);
                });
                doc.moveDown();
                
                // User Statistics
                if (options.includeUserStats) {
                    doc.addPage();
                    doc.fontSize(16).text('User Performance', { underline: true });
                    doc.fontSize(10);
                    doc.moveDown(0.5);
                    
                    users.forEach(user => {
                        if (doc.y > 700) {
                            doc.addPage();
                        }
                        
                        const userTasks = tasks.filter(t => t.assigned_to === user.id);
                        const userCompleted = userTasks.filter(t => t.status === 'completed').length;
                        const completionRate = userTasks.length > 0 ? ((userCompleted / userTasks.length) * 100).toFixed(1) : 0;
                        
                        doc.fontSize(12).text(`${user.full_name} (${user.role})`, { bold: true });
                        doc.fontSize(10);
                        doc.text(`  Total Tasks: ${userTasks.length}`);
                        doc.text(`  Completed: ${userCompleted}`);
                        doc.text(`  Completion Rate: ${completionRate}%`);
                        doc.moveDown(0.5);
                    });
                }
                
                // Footer
                const pages = doc.bufferedPageRange();
                for (let i = 0; i < pages.count; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8).text(
                        `Page ${i + 1} of ${pages.count}`,
                        50,
                        doc.page.height - 50,
                        { align: 'center' }
                    );
                }
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(outputPath);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;