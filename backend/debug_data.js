require('dotenv').config();
const { db } = require('./config/firebase');

async function debugData() {
    try {
        const snapshot = await db.collection('rmas').limit(5).get();
        if (snapshot.empty) {
            console.log('No RMAs found in collection.');
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`createdAt:`, data.createdAt, typeof data.createdAt);
            if (data.createdAt && data.createdAt.toDate) {
                console.log(`createdAt.toDate():`, data.createdAt.toDate());
            }
        });
    } catch (err) {
        console.error('Debug error:', err);
    }
}

debugData();
