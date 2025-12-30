const cron = require('node-cron');
const { db } = require('../config/firebase');
const nodemailer = require('nodemailer');
const { createObjectCsvStringifier } = require('csv-writer');

const SLA_DAYS = {
  step1: 2, // Created -> Received
  step2: 4, // Received -> Investigation
  step3: 5, // Investigation -> In Progress
  step4: 6  // In Progress -> Dispatched
};

const _ageDays = (date) => (Date.now() - new Date(date).getTime()) / 86400000;
const _fmt = (d) => new Date(d).toISOString().split('T')[0];

const _lastNotifiedForLabel = (notifiedStr, label) => {
  if (!notifiedStr) return null;
  const re = new RegExp(`Overdue ${label} on (\\d{4}-\\d{2}-\\d{2})`, 'gi');
  let match;
  let lastDate = null;
  while ((match = re.exec(notifiedStr)) !== null) {
    const d = new Date(match[1]);
    if (!isNaN(d)) lastDate = d;
  }
  return lastDate;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const checkOverdues = async () => {
  console.log('Running Daily Cron: Check Overdues');

  try {
    if (!db) return;

    const snapshot = await db.collection('rmas').get();
    const overdueSelection = [];
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];

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

      if (!step1) {
        label = 'Product Received';
        baselineDate = rma.createdAt;
        needDays = SLA_DAYS.step1;
      } else if (step1 && !step2) {
        label = 'Investigation Underway';
        baselineDate = rma.productReceivedEmailAt;
        needDays = SLA_DAYS.step2;
      } else if (step2 && !step3) {
        label = 'In Progress';
        baselineDate = rma.investigationUnderwayEmailAt;
        needDays = SLA_DAYS.step3;
      } else if (step3 && !step4) {
        label = 'Dispatched';
        baselineDate = rma.inProgressEmailAt;
        needDays = SLA_DAYS.step4;
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

          // Update adminNotified field
          const newNote = `${notifiedStr ? notifiedStr + '; ' : ''}Overdue ${label} on ${nowStr}`;
          await db.collection('rmas').doc(rma.id).update({
            adminNotified: newNote,
            updatedAt: now
          });
        }
      }
    }

    if (overdueSelection.length === 0) {
      console.log('No overdue items found.');
      return;
    }

    // Generate CSV
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'rmaNumber', title: 'RMA Number' },
        { id: 'name', title: 'Customer' },
        { id: 'email', title: 'Email' },
        { id: 'modelName', title: 'Model' },
        { id: 'serialNumber', title: 'Serial' },
        { id: 'faultDescription', title: 'Fault' },
        { id: 'baselineDate', title: 'Baseline Date' },
        { id: 'missingStep', title: 'Missing Step' }
      ]
    });

    const csvRecords = overdueSelection.map(o => ({
      rmaNumber: o.rma.rmaNumber,
      name: o.rma.name,
      email: o.rma.email,
      modelName: o.rma.modelName,
      serialNumber: o.rma.serialNumber,
      faultDescription: o.rma.faultDescription,
      baselineDate: _fmt(o.baselineDate),
      missingStep: o.label
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvRecords);

    // Generate HTML Table
    const tableRows = overdueSelection.map(o => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.rmaNumber}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.name}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.email}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.modelName}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.rma.serialNumber}</td>
        <td style="padding:6px;border:1px solid #ddd;">${_fmt(o.baselineDate)}</td>
        <td style="padding:6px;border:1px solid #ddd;">${o.label}</td>
      </tr>
    `).join('');

    const html = `
  <div style="font-family:Arial, sans-serif; line-height:1.45; max-width:1000px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h2 style="margin:0; font-size: 24px;">⚠️ Action Required: RMA Updates Overdue</h2>
    </div>
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
      <p style="margin:0; color: #991b1b; font-weight: bold;">
        ${overdueSelection.length} RMA${overdueSelection.length > 1 ? 's' : ''} require immediate attention!
      </p>
      <p style="margin:8px 0 0; color: #7f1d1d;">
        Customer updates have been missed. Please review and take action as soon as possible.
      </p>
    </div>
    <table style="border-collapse:collapse;border:1px solid #ccc; width:100%;">
      <thead>
        <tr style="background:#f7f7f7;">
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">RMA #</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Customer</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Email</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Model</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Serial</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Baseline Date</th>
          <th style="padding:8px;border:1px solid #ddd; text-align: left;">Missing Step</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div style="background: #f9fafb; padding: 16px; margin-top: 20px; border-radius: 8px; border-left: 4px solid #673ab7;">
      <p style="margin:0 0 8px; font-weight: bold; color: #374151;">📋 Time Limits (SLA):</p>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
        <li>RMA Created → Product Received: ${SLA_DAYS.step1} days</li>
        <li>Product Received → Investigation: ${SLA_DAYS.step2} days</li>
        <li>Investigation → In Progress: ${SLA_DAYS.step3} days</li>
        <li>In Progress → Dispatched: ${SLA_DAYS.step4} days</li>
      </ul>
    </div>
    <p style="margin:16px 0 0; color: #6b7280; font-size: 14px;">
      📎 A CSV file with complete details is attached for your records.
    </p>
    <p style="color:#9ca3af; margin:12px 0 0; font-size: 13px;">
      — Automated RMA Monitoring System
    </p>
  </div>
`;

    // Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `RMA Overdue Report (${overdueSelection.length} items)`,
      html: html,
      attachments: [{
        filename: `RMA_Overdue_${nowStr}.csv`,
        content: csvData
      }]
    });

    console.log('Overdue report sent.');

  } catch (err) {
    console.error('Cron job failed:', err);
  }
};

const initCron = () => {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', checkOverdues);
  console.log('✓ Cron Job Scheduled: Daily at 08:00 AM');
  console.log('  Time Limits (SLA):');
  console.log(`  - RMA Created → Product Received: ${SLA_DAYS.step1} days`);
  console.log(`  - Product Received → Investigation: ${SLA_DAYS.step2} days`);
  console.log(`  - Investigation → In Progress: ${SLA_DAYS.step3} days`);
  console.log(`  - In Progress → Dispatched: ${SLA_DAYS.step4} days`);
  console.log('  Admin will receive email alerts for overdue RMAs');
};

module.exports = { initCron, checkOverdues };
