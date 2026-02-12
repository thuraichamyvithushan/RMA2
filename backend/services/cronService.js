const cron = require('node-cron');
const { db } = require('../config/firebase');
const nodemailer = require('nodemailer');
const { createObjectCsvStringifier } = require('csv-writer');

const SLA_DAYS = {
    investigating: 4,
    inProgress: 5,
    dispatched: 5
};

const _ageDays = (date) => (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
const _fmt = (d) => new Date(d).toISOString().replace('T', ' ').split('.')[0];

const _lastNotifiedForLabel = (notifiedStr, label) => {
    if (!notifiedStr) return null;
    const re = new RegExp(`Overdue ${label} on ([\\d- :]+)`, 'gi');
    let match;
    let lastDate = null;
    while ((match = re.exec(notifiedStr)) !== null) {
        const d = new Date(match[1]);
        if (!isNaN(d)) lastDate = d;
    }
    return lastDate;
};

const getTransporter = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        pool: false, // Disabled pooling for stability
        greetingTimeout: 30000,
        auth: { user, pass }
    });
};

const checkOverdues = async () => {
    try {
        if (!db) return;
        const transporter = getTransporter();

        const snapshot = await db.collection('rmas').get();
        const overdueSelection = [];
        const now = new Date();
        const nowStr = now.toISOString().replace('T', ' ').split('.')[0];

        for (const doc of snapshot.docs) {
            const rma = { id: doc.id, ...doc.data() };

            const step1 = !!rma.productReceived;
            const step2 = !!rma.investigationUnderway;
            const step3 = !!rma.inProgress;
            const step4 = !!rma.dispatched;

            if (step4) continue;

            let label = null;
            let baselineDate = null;
            let needDays = 0;

            if (step1 && !step2) {
                label = 'Investigation';
                baselineDate = rma.productReceivedEmailAt || rma.updatedAt;
                needDays = SLA_DAYS.investigating;
            } else if (step2 && !step3) {
                label = 'In Progress';
                baselineDate = rma.investigationUnderwayEmailAt || rma.updatedAt;
                needDays = SLA_DAYS.inProgress;
            } else if (step3 && !step4) {
                label = 'Dispatched';
                baselineDate = rma.inProgressEmailAt || rma.updatedAt;
                needDays = SLA_DAYS.dispatched;
            }

            if (label && baselineDate) {
                const bDate = baselineDate.toDate ? baselineDate.toDate() : new Date(baselineDate);
                const ageFromBaseline = _ageDays(bDate);

                const notifiedStr = String(rma.adminNotified || '');
                const lastNotified = _lastNotifiedForLabel(notifiedStr, label);
                const ageFromLastNotify = lastNotified ? _ageDays(lastNotified) : Infinity;

                if (ageFromBaseline >= needDays && ageFromLastNotify >= needDays) {
                    overdueSelection.push({
                        rma,
                        label,
                        baselineDate: bDate,
                        age: Math.floor(ageFromBaseline)
                    });

                    const newNote = `${notifiedStr ? notifiedStr + '; ' : ''}Overdue ${label} on ${nowStr}`;
                    await db.collection('rmas').doc(rma.id).update({
                        adminNotified: newNote,
                        updatedAt: now
                    });
                }
            }
        }

        if (overdueSelection.length === 0) {
            console.log('[Cron] No overdue items found this cycle.');
            return;
        }

        console.log(`[Cron] Sending report for ${overdueSelection.length} items to ${process.env.ADMIN_EMAIL}...`);
        const dashUrl = process.env.FRONTEND_URL || 'https://rma-2.vercel.app';

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'no', title: 'No.' },
                { id: 'rmaNumber', title: 'RMA Number' },
                { id: 'name', title: 'Customer' },
                { id: 'email', title: 'Email' },
                { id: 'modelName', title: 'Model' },
                { id: 'serialNumber', title: 'Serial' },
                { id: 'faultDescription', title: 'Fault' },
                { id: 'baselineDate', title: 'Baseline Date' },
                { id: 'missingStep', title: 'Missing Step' },
                { id: 'viewUrl', title: 'View Link' }
            ]
        });

        const csvRecords = overdueSelection.map((o, index) => ({
            no: index + 1,
            rmaNumber: o.rma.rmaNumber,
            name: o.rma.name,
            email: o.rma.email,
            modelName: o.rma.modelName,
            serialNumber: o.rma.serialNumber,
            faultDescription: o.rma.faultDescription,
            baselineDate: _fmt(o.baselineDate),
            missingStep: o.label,
            viewUrl: `${dashUrl}/dashboard?search=${encodeURIComponent(o.rma.rmaNumber)}`
        }));

        const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvRecords);

        const tableRows = overdueSelection.map((o, index) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${index + 1}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.rmaNumber}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.name}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.email}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.modelName}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.serialNumber}</td>
        <td style="padding:6px;border:1px solid #ddd;">${_fmt(o.baselineDate)}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.label}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">
            <a href="${dashUrl}/dashboard?search=${encodeURIComponent(o.rma.rmaNumber)}" 
               style="background-color: #dc2626; color: white; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">
               VIEW
            </a>
        </td>
      </tr>
    `).join('');

        const html = `
  <div style="font-family:Arial, sans-serif; line-height:1.45; max-width:1000px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h2 style="margin:0; font-size: 24px;">⚠️ RMA Updates Overdue</h2>
    </div>
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
      <p style="margin:0; color: #991b1b; font-weight: bold;">
        ${overdueSelection.length} RMA${overdueSelection.length > 1 ? 's' : ''} require immediate attention!
      </p>
      <p style="margin:8px 0 0; color: #7f1d1d;">
        Customer updates have been missed.
      </p>
    </div>
    <table style="border-collapse:collapse;border:1px solid #ccc; width:100%;">
      <thead>
        <tr style="background:#f7f7f7;">
          <th style="padding:8px;border:1px solid #ddd; text-align: center;">No.</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">RMA #</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Customer</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Email</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Model</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Serial</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Baseline Date</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Missing Step</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: center;">View</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div style="background: #f9fafb; padding: 16px; margin-top: 20px; border-radius: 8px; border-left: 4px solid #673ab7;">
      <p style="margin:0 0 8px; font-weight: bold; color: #374151;">📋 SLA Time Limits (Days):</p>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
        <li>Product Received → Investigation: ${SLA_DAYS.investigating} days</li>
        <li>Investigation → In Progress: ${SLA_DAYS.inProgress} days</li>
        <li>In Progress → Dispatched: ${SLA_DAYS.dispatched} days</li>
      </ul>
    </div>
  </div>
`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.ADMIN_EMAIL,
                subject: `RMA Overdue Report (${overdueSelection.length} items)`,
                html: html,
                attachments: [{
                    filename: `RMA_Overdue_Report_${nowStr}.csv`,
                    content: csvData
                }]
            });
            console.log(`[Cron] ✓ Overdue report successfully sent to ${process.env.ADMIN_EMAIL}`);
        } catch (emailErr) {
            console.error(`[Cron] ✗ Failed to send overdue report:`, emailErr.message);
        }

    } catch (err) {
        console.error('[Cron] ✗ Cron job failed:', err);
    }
};

const autoArchiveRMAs = async () => {
    try {
        if (!db) return;
        console.log('📦 Running Auto-Archive Check...');
        const snapshot = await db.collection('rmas')
            .where('dispatched', '==', true)
            .get();

        const now = new Date();
        let archivedCount = 0;

        for (const doc of snapshot.docs) {
            const rma = doc.data();
            if (rma.archived) continue;

            const completionDate = rma.dispatchedEmailAt
                ? (rma.dispatchedEmailAt.toDate ? rma.dispatchedEmailAt.toDate() : new Date(rma.dispatchedEmailAt))
                : (rma.updatedAt.toDate ? rma.updatedAt.toDate() : new Date(rma.updatedAt));

            const daysSinceCompletion = (now.getTime() - completionDate.getTime()) / 86400000;

            if (daysSinceCompletion >= 21) {
                await db.collection('rmas').doc(doc.id).update({
                    archived: true,
                    archivedAt: now,
                    updatedAt: now
                });
                archivedCount++;
            }
        }

        if (archivedCount > 0) {
            console.log(`✓ Auto-archived ${archivedCount} RMAs.`);
        } else {
            console.log('ℹ No RMAs to auto-archive.');
        }
    } catch (err) {
        console.error('Auto-archive job failed:', err);
    }
};

let isTaskRunning = false;
let cronInitialized = false;

const initCron = () => {
    if (cronInitialized) {
        console.log('[Cron] ℹ Cron already initialized, skipping redundant setup.');
        return;
    }

    // Run daily at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        if (isTaskRunning) {
            console.log('[Cron] ⏳ Job already in progress, skipping this cycle.');
            return;
        }

        isTaskRunning = true;
        try {
            console.log(`[Cron] 🚀 Starting scheduled run at ${new Date().toISOString()}`);
            await checkOverdues();
            await autoArchiveRMAs();
        } catch (err) {
            console.error('[Cron] ✗ Scheduled run failed:', err);
        } finally {
            isTaskRunning = false;
        }
    });

    cronInitialized = true;
    console.log('✓ Cron Job Scheduled (Daily at 8:00 AM)');
};

module.exports = { initCron, checkOverdues, autoArchiveRMAs };
