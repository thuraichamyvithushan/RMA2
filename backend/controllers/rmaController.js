const { db } = require('../config/firebase');
const { sendEmail } = require('../services/emailService');

// Create RMA
exports.createRMA = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not initialized" });
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const rmaNumber = `RMA-${datePart}-${randomPart}`;

        const rmaData = {
            ...req.body,
            rmaNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Steps
            productReceived: false,
            investigationUnderway: false,
            inProgress: false,
            dispatched: false
        };

        const docRef = await db.collection('rmas').add(rmaData);

        // Send confirmation email to customer
        try {
            const confirmationEmailData = {
                sender: rmaData.name,
                productSerialNo: rmaData.serialNumber,
                productName: rmaData.modelName,
                issueReported: rmaData.faultDescription,
                rmaNumber: rmaNumber
            };

            await sendEmail(rmaData.email, 'rmaSubmitted', confirmationEmailData);
            console.log(`✓ Confirmation email sent to customer: ${rmaData.email}`);
        } catch (emailError) {
            console.error('✗ Failed to send confirmation email to customer:', emailError.message);
        }

        // Send notification email to admin
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'thuraichamyvithushan19@gmail.com';
            console.log(`📧 Attempting to send admin notification to: ${adminEmail}...`);
            const adminEmailData = {
                sender: rmaData.name,
                productSerialNo: rmaData.serialNumber,
                productName: rmaData.modelName,
                issueReported: rmaData.faultDescription,
                rmaNumber: rmaNumber,
                customerEmail: rmaData.email,
                contactPhone: rmaData.contactPhone,
                address: `${rmaData.address}, ${rmaData.suburb}, ${rmaData.state} ${rmaData.postCode}`
            };

            await sendEmail(adminEmail, 'adminNotification', adminEmailData);
            console.log(`✓ Admin notification sent successfully to: ${adminEmail}`);
        } catch (emailError) {
            console.error('✗ Failed to send admin notification:', emailError.message);
        }

        res.status(201).json({ id: docRef.id, ...rmaData });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get All RMA
exports.getRMAs = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not initialized" });
        const { search = '' } = req.query;
        let query = db.collection('rmas').orderBy('createdAt', 'desc');

        const snapshot = await query.get();
        let rmas = [];
        snapshot.forEach(doc => {
            rmas.push({ id: doc.id, ...doc.data() });
        });

        if (search) {
            const lowerSearch = search.toLowerCase();
            rmas = rmas.filter(rma =>
                (rma.serialNumber && rma.serialNumber.toLowerCase().includes(lowerSearch)) ||
                (rma.email && rma.email.toLowerCase().includes(lowerSearch)) ||
                (rma.name && rma.name.toLowerCase().includes(lowerSearch)) ||
                (rma.rmaNumber && rma.rmaNumber.toLowerCase().includes(lowerSearch))
            );
        }

        res.json({ rmas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Status
exports.updateRMAStatus = async (req, res) => {
    const { id } = req.params;
    const { step, value } = req.body;

    try {
        const rmaRef = db.collection('rmas').doc(id);
        const doc = await rmaRef.get();
        if (!doc.exists) return res.status(404).json({ error: "RMA not found" });

        const rma = doc.data();

        const steps = {
            productReceived: { name: "Product Received", prereq: null },
            investigationUnderway: { name: "Investigation Underway", prereq: "productReceived" },
            inProgress: { name: "In Progress", prereq: "investigationUnderway" },
            dispatched: { name: "Dispatched", prereq: "inProgress" }
        };

        const thisStep = steps[step];
        if (thisStep && thisStep.prereq && !rma[thisStep.prereq]) {
            return res.status(400).json({ error: `Hold on — you can’t send “${thisStep.name} Email” until “${steps[thisStep.prereq].name} Email” is sent.` });
        }

        const updates = { [step]: value, updatedAt: new Date() };

        if (value === true) {
            const emailData = {
                sender: rma.name,
                productSerialNo: rma.serialNumber,
                productName: rma.modelName,
                issueReported: rma.faultDescription,
                trackingNumber: rma.trackingNumber || '',
                repairDescription: rma.repairDescription || '',
                updateOnProduct: rma.updateOnProduct || ''
            };

            const timestampField = `${step}EmailAt`;
            if (!rma[timestampField]) {
                console.log(` Attempting to send ${step} email to ${rma.email}...`);
                try {
                    const sent = await sendEmail(rma.email, step, emailData);
                    if (sent) {
                        updates[timestampField] = new Date();
                        console.log(`✓ Email sent successfully to ${rma.email} for step: ${step}`);
                    } else {
                        console.error(`✗ Email failed to send to ${rma.email} for step: ${step}`);
                    }
                } catch (emailError) {
                    console.error(`✗ Email error for ${rma.email}:`, emailError.message);
                    // Continue with status update even if email fails
                }
            } else {
                console.log(`ℹ Email already sent for ${step} at ${rma[timestampField]}`);
            }
        }

        await rmaRef.update(updates);
        res.json({ id, ...rma, ...updates });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateRMA = async (req, res) => {
    const { id } = req.params;

    try {
        const rmaRef = db.collection('rmas').doc(id);
        const doc = await rmaRef.get();
        if (!doc.exists) return res.status(404).json({ error: "RMA not found" });

        const editableFields = [
            'name', 'companyName', 'email', 'contactPhone', 'address',
            'suburb', 'state', 'postCode', 'modelName', 'serialNumber',
            'faultDescription', 'customerReference', 'contentsOfPackage',
            'weight', 'width', 'height', 'length', 'requireLabel',
            'trackingNumber', 'repairDescription', 'updateOnProduct',
            'assignedTo', 'huntsmanRepairStatus', 'sparePartsUpdate',
            'sparePartOrdered', 'sparePartReceived', 'completeDateOfReturn',
            'receivedDate', 'startedServiceDate'
        ];

        const updates = { updatedAt: new Date() };
        editableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        await rmaRef.update(updates);
        res.json({ id, ...doc.data(), ...updates });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRMA = async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ Attempting to delete RMA with ID: ${id}`);
    try {
        const rmaRef = db.collection('rmas').doc(id);
        const doc = await rmaRef.get();
        if (!doc.exists) {
            console.error(`✗ RMA not found: ${id}`);
            return res.status(404).json({ error: "RMA not found" });
        }

        await rmaRef.delete();
        console.log(`✓ RMA deleted successfully: ${id}`);
        res.json({ message: "RMA deleted successfully" });
    } catch (err) {
        console.error(`✗ Deletion error for ${id}:`, err.message);
        res.status(500).json({ error: err.message });
    }
};
