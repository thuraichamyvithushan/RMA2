const admin = require('firebase-admin');

let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
        console.error('ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON.');
    }
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized Successfully');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error.message);
    }
} else {
    console.warn('CRITICAL: FIREBASE_SERVICE_ACCOUNT not found in environment. Backend database features are DISABLED.');
    console.log('Current environment variables (keys):', Object.keys(process.env).filter(k => k.includes('FIREBASE')));
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };
