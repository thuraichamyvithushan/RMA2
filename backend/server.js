
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { auth: firebaseAuth } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const rmaController = require('./controllers/rmaController');
const authController = require('./controllers/authController');
const { initCron, checkOverdues } = require('./services/cronService');

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth - These will now mostly be handled by Firebase client-side, 
// but we keep some endpoints for sync if needed.
app.post('/api/auth/sync', authController.protect, authController.syncUser);

// Public
app.post('/api/rma', rmaController.createRMA);

// Admin (Protected)
app.get('/api/admin/rmas', authController.protect, authController.adminOnly, rmaController.getRMAs);
app.post('/api/admin/check-overdues', authController.protect, authController.adminOnly, async (req, res) => {
    try {
        await checkOverdues();
        res.json({ message: "Overdue check triggered successfully. Check your email for the report." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.put('/api/admin/rmas/:id/status', authController.protect, authController.adminOnly, rmaController.updateRMAStatus);
app.put('/api/admin/rmas/:id', authController.protect, authController.adminOnly, rmaController.updateRMA);
app.delete('/api/admin/rmas/:id', authController.protect, authController.adminOnly, rmaController.deleteRMA);
app.get('/api/admin/staff', authController.protect, authController.adminOnly, authController.getStaff);
app.put('/api/admin/users/:uid/role', authController.protect, authController.adminOnly, authController.updateUserRole);
app.delete('/api/admin/users/:uid', authController.protect, authController.adminOnly, authController.deleteUser);

// Start Cron
initCron();

// 404 Handler - Keep at the bottom
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found on this server.` });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
