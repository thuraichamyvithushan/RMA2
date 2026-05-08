const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { checkOverdues } = require('../services/cronService');

async function verifyProduction() {
    console.log('🚀 Triggering Production Overdue Check...');
    try {
        await checkOverdues();
        console.log('✅ Production check triggered successfully.');
    } catch (err) {
        console.error('❌ Production check failed:', err);
    }
}

verifyProduction();
