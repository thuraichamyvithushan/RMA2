require('dotenv').config();
const { db } = require('./config/firebase');

async function checkArchivedFieldTypes() {
    try {
        const snapshot = await db.collection('rmas').limit(100).get();
        console.log(`Checking first ${snapshot.size} RMAs...`);

        const typeCounts = {};

        snapshot.forEach(doc => {
            const val = doc.data().archived;
            const type = typeof val;
            const fullType = val === null ? 'null' : (Array.isArray(val) ? 'array' : type);
            const key = `${fullType}:${val}`;
            typeCounts[key] = (typeCounts[key] || 0) + 1;
        });

        console.log('Archived field distribution (type:value):');
        Object.entries(typeCounts).forEach(([key, count]) => {
            console.log(`- ${key}: ${count}`);
        });

    } catch (err) {
        console.error('Debug error:', err);
    }
}

checkArchivedFieldTypes();
