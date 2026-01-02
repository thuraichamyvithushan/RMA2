const { auth, db } = require('../config/firebase');
const { sendEmail } = require('../services/emailService');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (err) {
        console.error('Firebase Auth Error:', err);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

exports.adminOnly = async (req, res, next) => {
    try {
        const userRef = db.collection('users').doc(req.user.uid);
        const doc = await userRef.get();
        if (doc.exists && doc.data().role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Require Admin Role' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.adminOrRepresentative = async (req, res, next) => {
    try {
        const userRef = db.collection('users').doc(req.user.uid);
        const doc = await userRef.get();
        if (doc.exists && ['admin', 'representative'].includes(doc.data().role)) {
            next();
        } else {
            res.status(403).json({ message: 'Require Admin or Representative Role' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.syncUser = async (req, res) => {
    try {
        const { uid, email, name, picture } = req.user;
        const userRef = db.collection('users').doc(uid);

        const snapshot = await db.collection('users').get();
        let role = 'staff';
        if (snapshot.empty) {
            role = 'admin';
        } else {
            const existingDoc = await userRef.get();
            if (existingDoc.exists) {
                role = existingDoc.data().role || 'staff';
            }
        }

        await userRef.set({
            email,
            name: name || '',
            photoURL: picture || '',
            lastLogin: new Date(),
            role
        }, { merge: true });

        res.json({ message: 'User synced', role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStaff = async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const staff = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            staff.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
                lastLogin: data.lastLogin ? data.lastLogin.toDate() : null
            });
        });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    const { uid } = req.params;
    const { role } = req.body;
    try {
        if (!['admin', 'staff', 'representative'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = doc.data();
        const oldRole = userData.role;

        await userRef.update({ role });

        // Send email only if the role has actually changed and it's a "promotion" (or just an update to admin/rep)
        if (oldRole !== role && (role === 'admin' || role === 'representative')) {
            try {
                await sendEmail(userData.email, 'roleUpdated', {
                    sender: userData.name || userData.email,
                    role: role
                });
            } catch (emailErr) {
                console.error('Failed to send role update email:', emailErr);
                // Don't fail the request if email fails
            }
        }

        res.json({ message: `Role updated to ${role}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { uid } = req.params;
    try {
        await auth.deleteUser(uid);
        await db.collection('users').doc(uid).delete();
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: err.message });
    }
};
