require('dotenv').config();
const { db } = require('./config/firebase');

async function checkArchivedFields() {
    try {
        const snapshot = await db.collection('rmas').get();
        console.log(`Total RMAs: ${snapshot.size}`);

        let missing = 0;
        let setFalse = 0;
        let setTrue = 0;
        let other = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.archived === undefined) {
                missing++;
            } else if (data.archived === false) {
                setFalse++;
            } else if (data.archived === true) {
                setTrue++;
            } else {
                other++;
                console.log(`ID ${doc.id} has weird archived value:`, data.archived);
            }
        });

        console.log(`Archived Field stats:`);
        console.log(`- Missing: ${missing}`);
        console.log(`- false: ${setFalse}`);
        console.log(`- true: ${setTrue}`);
        console.log(`- Other: ${other}`);

    } catch (err) {
        console.error('Debug error:', err);
    }
}

checkArchivedFields();
