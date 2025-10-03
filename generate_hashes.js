const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password: password123');
    console.log('Hash:', hash);
}

generateHash();