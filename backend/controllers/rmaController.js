const { db } = require('../config/firebase');
const { sendEmail } = require('../services/emailService');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs');

exports.createRMA = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const rmaNumber = `RMA-${datePart}-${randomPart}`;

        const rmaData = {
            ...req.body,
            rmaNumber,
            status: 'Pending',
            archived: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection('rmas').add(rmaData);
        res.status(201).json({ id: docRef.id, ...rmaData });
    } catch (err) {
        console.error('Create RMA error:', err);
        res.status(400).json({ error: err.message });
    }
};

const formatDate = (dateValue) => {
    if (!dateValue) return '';
    try {
        if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
            return dateValue.toDate().toISOString();
        }
        if (dateValue && dateValue._seconds !== undefined) {
            return new Date(dateValue._seconds * 1000).toISOString();
        }
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? '' : date.toISOString();
    } catch (e) {
        return '';
    }
};

exports.exportRMAs = async (req, res) => {
    console.log('🏁 Export process started...');
    try {
        if (!db) {
            console.error('❌ Database not initialized');
            return res.status(500).json({ error: "Database not initialized" });
        }

        console.log('📡 Fetching RMAs from Firestore...');
        const snapshot = await db.collection('rmas').orderBy('createdAt', 'desc').get();
        console.log(`✅ Snapshot retrieved. Size: ${snapshot.size}`);

        const rmas = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const formatted = {
                ...data,
                id: doc.id,
                createdAt: formatDate(data.createdAt),
                updatedAt: formatDate(data.updatedAt),
                archivedAt: formatDate(data.archivedAt),
                productReceivedEmailAt: formatDate(data.productReceivedEmailAt),
                investigationUnderwayEmailAt: formatDate(data.investigationUnderwayEmailAt),
                inProgressEmailAt: formatDate(data.inProgressEmailAt)
            };
            rmas.push(formatted);
        });

        if (rmas.length === 0) {
            console.warn('⚠️ No RMAs found to export.');
            return res.status(404).json({ error: "No RMAs found to export" });
        }

        console.log(`📊 Processing ${rmas.length} records into CSV...`);
        const parser = new Parser();
        const csvData = parser.parse(rmas);

        console.log('✅ CSV generated successfully. Sending response...');
        res.header('Content-Type', 'text/csv');
        res.attachment(`rmas_export_${new Date().toISOString().slice(0, 10)}.csv`);
        res.send(csvData);

    } catch (err) {
        console.error('🚨 Export error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.importRMAs = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Please upload a CSV file" });

        const results = [];
        const rmaNumbersInFile = new Set();

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    const batch = db.batch();
                    let updatedCount = 0;
                    let createdCount = 0;

                    for (const row of results) {
                        let rmaRef;
                        let rmaNumber = row.rmaNumber;
                        const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val);

                        // Basic cleanup and type conversion
                        const cleanedData = {
                            ...row,
                            archived: row.archived === 'true' || row.archived === 'TRUE' || row.archived === true,
                            productReceived: row.productReceived === 'true' || row.productReceived === 'TRUE' || row.productReceived === true,
                            investigationUnderway: row.investigationUnderway === 'true' || row.investigationUnderway === 'TRUE' || row.investigationUnderway === true,
                            inProgress: row.inProgress === 'true' || row.inProgress === 'TRUE' || row.inProgress === true,
                            dispatched: row.dispatched === 'true' || row.dispatched === 'TRUE' || row.dispatched === true,
                            weight: isNumeric(row.weight) ? parseFloat(row.weight) : (row.weight || 0),
                            width: isNumeric(row.width) ? parseFloat(row.width) : (row.width || 0),
                            height: isNumeric(row.height) ? parseFloat(row.height) : (row.height || 0),
                            length: isNumeric(row.length) ? parseFloat(row.length) : (row.length || 0),
                            updatedAt: new Date()
                        };

                        // Remove empty ID if present
                        if (cleanedData.id) delete cleanedData.id;

                        if (rmaNumber) {
                            // Try to find existing by rmaNumber
                            const existing = await db.collection('rmas').where('rmaNumber', '==', rmaNumber).get();
                            if (!existing.empty) {
                                rmaRef = existing.docs[0].ref;
                                batch.update(rmaRef, cleanedData);
                                updatedCount++;
                            } else {
                                rmaRef = db.collection('rmas').doc();
                                cleanedData.createdAt = new Date();
                                batch.set(rmaRef, cleanedData);
                                createdCount++;
                            }
                        } else {
                            // No RMA number, create new
                            const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                            const randomPart = Math.floor(1000 + Math.random() * 9000);
                            cleanedData.rmaNumber = `RMA-${datePart}-${randomPart}`;
                            cleanedData.createdAt = new Date();
                            rmaRef = db.collection('rmas').doc();
                            batch.set(rmaRef, cleanedData);
                            createdCount++;
                        }
                    }

                    await batch.commit();

                    // Clean up temp file
                    fs.unlinkSync(req.file.path);

                    res.json({ message: `Successfully processed ${results.length} records.`, created: createdCount, updated: updatedCount });
                } catch (batchErr) {
                    console.error('Batch commit error:', batchErr);
                    res.status(500).json({ error: "Failed to process records: " + batchErr.message });
                }
            });

    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getRMAs = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not initialized" });
        const { search = '', archived = 'false' } = req.query;
        let query = db.collection('rmas').orderBy('createdAt', 'desc');

        const isArchived = archived === 'true';

        const snapshot = await query.get();
        let rmas = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const rmaIsArchived = data.archived === true;
            if (rmaIsArchived === isArchived) {
                rmas.push({ id: doc.id, ...data });
            }
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

exports.deleteAllRMAs = async (req, res) => {
    const { archived = 'false' } = req.query;
    const isArchived = archived === 'true';
    console.log(`🗑️ [Bulk Delete] Request received. Target: ${isArchived ? 'ARCHIVED' : 'ACTIVE'} records.`);

    try {
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Fetch ALL rmas and filter in code to be safer against missing fields
        const snapshot = await db.collection('rmas').get();
        console.log(`📡 [Bulk Delete] Total records in DB: ${snapshot.size}`);

        const docsToDelete = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const rmaIsArchived = data.archived === true; // Treat missing/null/false as false
            if (rmaIsArchived === isArchived) {
                docsToDelete.push(doc);
            }
        });

        console.log(`📊 [Bulk Delete] Found ${docsToDelete.length} matching records to delete.`);

        if (docsToDelete.length === 0) {
            return res.json({ message: "No matching records found to delete." });
        }

        // Firestore batch limit is 500. For now we assume < 500, but let's be safe.
        const batch = db.batch();
        docsToDelete.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`✅ [Bulk Delete] Successfully deleted ${docsToDelete.length} records.`);
        res.json({ message: `Successfully deleted ${docsToDelete.length} ${isArchived ? 'archived' : 'active'} records.` });
    } catch (err) {
        console.error('❌ [Bulk Delete] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.archiveRMA = async (req, res) => {
    const { id } = req.params;
    console.log(`📦 Attempting to archive RMA with ID: ${id}`);
    try {
        const rmaRef = db.collection('rmas').doc(id);
        const doc = await rmaRef.get();
        if (!doc.exists) {
            console.error(`✗ RMA not found: ${id}`);
            return res.status(404).json({ error: "RMA not found" });
        }

        const updates = {
            archived: true,
            archivedAt: new Date(),
            updatedAt: new Date()
        };

        await rmaRef.update(updates);
        console.log(`✓ RMA archived successfully: ${id}`);
        res.json({ message: "RMA archived successfully", ...updates });
    } catch (err) {
        console.error(`✗ Archive error for ${id}:`, err.message);
        res.status(500).json({ error: err.message });
    }
};
