// Database initialization script
require('dotenv').config();
const DatabaseManager = require('./database');

console.log('=================================');
console.log('Database Initialization Script');
console.log('=================================\n');

try {
    console.log('Initializing database...');
    const db = new DatabaseManager();
    
    console.log('\n✓ Database initialized successfully!');
    console.log('\nDefault admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123 (or the password set in .env)');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!\n');
    console.log('Database location:', process.env.DATABASE_PATH || './database/business_management.db');
    console.log('\nYou can now start the server with: npm start');
    console.log('=================================\n');
    
    db.close();
    process.exit(0);
} catch (error) {
    console.error('\n✗ Error initializing database:', error.message);
    console.error('\nPlease check the error above and try again.');
    process.exit(1);
}