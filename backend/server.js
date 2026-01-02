
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { auth: firebaseAuth } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const rmaController = require('./controllers/rmaController');
const authController = require('./controllers/authController');
const { initCron, checkOverdues } = require('./services/cronService');


app.get('/', (req, res) => res.json({ message: "Welcome to the RMA Backend API. Use /api/health to check status." }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/rma', (req, res) => res.status(405).json({ error: "Method Not Allowed. This endpoint only accepts POST requests for RMA creation." }));
app.get('/api/auth/login', (req, res) => res.status(405).json({ error: "Method Not Allowed. This endpoint only accepts POST requests for Login." }));
app.get('/api/auth/register', (req, res) => res.status(405).json({ error: "Method Not Allowed. This endpoint only accepts POST requests for Registration." }));


app.post('/api/auth/sync', authController.protect, authController.syncUser);

// Public
app.post('/api/rma', rmaController.createRMA);

// Admin (Protected)
app.get('/api/admin/rmas', authController.protect, authController.adminOrRepresentative, rmaController.getRMAs);
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
app.get('/api/admin/staff', authController.protect, authController.adminOrRepresentative, authController.getStaff);
app.put('/api/admin/users/:uid/role', authController.protect, authController.adminOnly, authController.updateUserRole);
app.delete('/api/admin/users/:uid', authController.protect, authController.adminOnly, authController.deleteUser);

initCron();

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found on this server.` });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
