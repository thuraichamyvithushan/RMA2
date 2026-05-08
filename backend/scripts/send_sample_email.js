const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const { createObjectCsvStringifier } = require('csv-writer');

const SLA_DAYS = {
  investigating: 4,
  inProgress: 5,
  dispatched: 5
};

const _fmt = (d) => new Date(d).toISOString().replace('T', ' ').split('.')[0];

const getTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: false,
    greetingTimeout: 30000,
    auth: { user, pass }
  });
};

const sendSampleOverdueEmail = async () => {
  try {
    const transporter = getTransporter();
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').split('.')[0];
    const dashUrl = process.env.FRONTEND_URL || 'https://rma-2.vercel.app';

    // Mock data for the sample email
    const overdueSelection = [
      {
        rma: {
          rmaNumber: 'RMA-SAM-001',
          name: 'John Doe (Sample)',
          email: 'sample@example.com',
          modelName: 'Sample Product Pro',
          serialNumber: 'SN-123456789',
          faultDescription: 'The device does not power on.'
        },
        label: 'Investigation',
        baselineDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        age: 5
      },
      {
        rma: {
          rmaNumber: 'RMA-SAM-002',
          name: 'Jane Smith (Sample)',
          email: 'jane.sample@example.com',
          modelName: 'Elite Watch Series 9',
          serialNumber: 'SN-987654321',
          faultDescription: 'Screen flickering.'
        },
        label: 'In Progress',
        baselineDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        age: 6
      }
    ];

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'no', title: 'No.' },
        { id: 'rmaNumber', title: 'Booking Number' },
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
      <h2 style="margin:0; font-size: 24px;">⚠️ RMA Updates Overdue (SAMPLE FORMAT)</h2>
    </div>
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
      <p style="margin:0; color: #991b1b; font-weight: bold;">
        ${overdueSelection.length} RMA${overdueSelection.length > 1 ? 's' : ''} require immediate attention!
      </p>
      <p style="margin:8px 0 0; color: #7f1d1d;">
        Note: This is a sample email to demonstrate the current format.
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

    console.log(`Sending sample report to ${process.env.ADMIN_EMAIL}...`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `RMA Overdue Report (SAMPLE FORMAT)`,
      html: html,
      attachments: [{
        filename: `RMA_Overdue_SAMPLE_${nowStr}.csv`,
        content: csvData
      }]
    });

    console.log(`✓ Sample email sent successfully to ${process.env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error('✗ Failed to send sample email:', err);
  }
};

sendSampleOverdueEmail();
