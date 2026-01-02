const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const IMAGES = {
  LOGO: "https://res.cloudinary.com/djprlosej/image/upload/v1732701713/yfuinygtvdasjdo0ljma.png"
};

const _esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const getSubject = (step, serial) => {
  switch (step) {
    case 'adminNotification': return `New RMA Submission – ${serial}`;
    case 'rmaSubmitted': return `RMA Submission Confirmed – RMA Number ${serial}`;
    case 'productReceived': return `Confirmation of Product Receipt – Serial Number ${serial}`;
    case 'investigationUnderway': return `Investigation Underway – Serial Number ${serial}`;
    case 'inProgress': return `Update on Your Product – Serial Number ${serial}`;
    case 'dispatched': return `Repair and Assessment of Warranty Completed – Serial Number ${serial}`;
    case 'roleUpdated': return `Portal Access Updated – Your New Role: ${serial}`;
    default: return `RMA Update – Serial Number ${serial}`;
  }
};

const getHtmlBody = (step, data) => {
  const { sender, productSerialNo, productName, issueReported, trackingNumber, repairDescription, rmaNumber, customerEmail, contactPhone, address } = data;
  const dateStr = new Date().toLocaleDateString();

  const signature = `
    <p>Best regards,<br>
    <span style="color: red; font-weight: bold;">Admin</span> 
    <span style="color: gray;">RMA Centre<br>Australia</span></p>
    <img src="${IMAGES.LOGO}" alt="Logo" style="height:60px;width:auto;display:block;margin-top:10px;">
    <p style="color: gray; font-size: small; font-style: italic;">The content of this e-mail is confidential ...</p>
    `;

  if (step === 'adminNotification') {
    return `
      <h2 style="color: #673ab7;">New RMA Submission Received</h2>
      <p>A new RMA request has been submitted on <strong>${_esc(dateStr)}</strong>.</p>
      <p><strong>RMA Details:</strong></p>
      <ul>
        <li><strong>RMA Number:</strong> ${_esc(rmaNumber)}</li>
        <li><strong>Customer Name:</strong> ${_esc(sender)}</li>
        <li><strong>Customer Email:</strong> ${_esc(customerEmail)}</li>
        <li><strong>Contact Phone:</strong> ${_esc(contactPhone)}</li>
        <li><strong>Serial Number:</strong> ${_esc(productSerialNo)}</li>
        <li><strong>Product Name:</strong> ${_esc(productName)}</li>
        <li><strong>Issue Reported:</strong> ${_esc(issueReported)}</li>
        <li><strong>Address:</strong> ${_esc(address)}</li>
      </ul>
      <p><strong>Action Required:</strong></p>
      <p>Please review this RMA submission in the admin panel and update the status accordingly.</p>
      ${signature}
    `;
  }

  if (step === 'rmaSubmitted') {
    return `
      <p>Dear ${_esc(sender)},</p>
      <p>Thank you for submitting your RMA request. We have received your submission on <strong>${_esc(dateStr)}</strong>.</p>
      <p><strong>Your RMA Details:</strong></p>
      <ul>
        <li><strong>RMA Number:</strong> ${_esc(rmaNumber)}</li>
        <li><strong>Serial Number:</strong> ${_esc(productSerialNo)}</li>
        <li><strong>Product Name:</strong> ${_esc(productName)}</li>
        <li><strong>Issue Reported:</strong> ${_esc(issueReported)}</li>
      </ul>
      <p><strong>Next Steps:</strong></p>
      <p>Please send your product to our RMA Centre. Once we receive it, we will send you another confirmation email and begin the assessment process.</p>
      <p>If you have any questions, feel free to contact us at <a href="mailto:rma@huntsmanoptics.com">rma@huntsmanoptics.com</a>.</p>
      ${signature}
    `;
  }

  if (step === 'productReceived') {
    return `
      <p>Dear ${_esc(sender)},</p>
      <p>Thank you for sending us your product for RMA services. We have received it on <strong>${_esc(dateStr)}</strong>. 
      It has been lodged into our Repair Centre, and we will contact you with updates shortly.</p>
      <p><strong>Details of your request:</strong></p>
      <ul>
        <li><strong>Serial Number:</strong> ${_esc(productSerialNo)}</li>
        <li><strong>Product Name:</strong> ${_esc(productName)}</li>
        <li><strong>Issue Reported:</strong> ${_esc(issueReported)}</li>
      </ul>
      <p>If you have any questions, feel free to contact us at <a href="mailto:rma@huntsmanoptics.com">rma@huntsmanoptics.com</a>.</p>
      ${signature}
    `;
  }

  if (step === 'investigationUnderway') {
    return `
      <p>Dear ${_esc(sender)},</p>
      <p>We have started investigating your product's issue as part of the RMA services process. Our technical team is working diligently to diagnose the problem.</p>
      <p><strong>Details of the investigation:</strong></p>
      <ul>
        <li><strong>Serial Number:</strong> ${_esc(productSerialNo)}</li>
        <li><strong>Status:</strong> Investigation started on <strong>${_esc(dateStr)}</strong></li>
      </ul>
      <p>We will keep you updated as we move forward. If you need further information, feel free to reply to this email or contact our support team at <a href="mailto:rma@huntsmanoptics.com">rma@huntsmanoptics.com</a>.</p>
      ${signature}
    `;
  }

  if (step === 'inProgress') {
    return `
      <p>Dear ${_esc(sender)},</p>
      <p>We have completed the diagnosis of your product and have identified the necessary parts required to resolve the issue. These parts have been ordered from our Head Office at Hikmicro.</p>
      <p>We will keep you informed of any updates regarding the parts' arrival and the next steps in the process.</p>
      <p>If you have any questions in the meantime, please contact us at <a href="mailto:glen@huntsmanoptics.com">glen@huntsmanoptics.com</a>.</p>
      ${signature}
    `;
  }

  if (step === 'dispatched') {
    return `
      <p>Dear ${_esc(sender)},</p>
      <p>We’re pleased to inform you that the RMA services process for your product has been completed and will be sent back to your allocated address as soon as possible on the tracking below.</p>
      <ul>
        <li><strong>Serial Number:</strong> ${_esc(productSerialNo)}</li>
        <li><strong>Repair Performed:</strong> ${_esc(repairDescription)}</li>
        <li><strong>Tracking Number:</strong> ${_esc(trackingNumber)}</li>
      </ul>
      ${signature}
    `;
  }

  if (step === 'roleUpdated') {
    const roleCapitalized = data.role.charAt(0).toUpperCase() + data.role.slice(1);
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${_esc(sender)},</p>
        <p>We are pleased to inform you that your access level for the <strong>RMA Portal</strong> has been updated.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 1.1rem;">Your new role: <strong style="color: #f59e0b;">${_esc(roleCapitalized)}</strong></p>
        </div>
        <p>With this new role, you now have access to the dashboard and other administrative features corresponding to your permissions.</p>
        <p>Please log in to the portal to explore your updated access:</p>
        <div style="margin: 30px 0;">
          <a href="https://rma.huntsmanoptics.com/login" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
        </div>
        <p>If you have any questions regarding your new permissions, please contact the System Administrator.</p>
        ${signature}
      </div>
    `;
  }

  return '';
};

const sendEmail = async (to, step, data) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[DEV] Mock sending email to ${to} for step ${step}`);
    return true;
  }

  const subjectIdentifier = (step === 'rmaSubmitted' || step === 'adminNotification')
    ? data.rmaNumber
    : data.productSerialNo;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: getSubject(step, subjectIdentifier),
    html: getHtmlBody(step, data)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    throw error;
  }
};

module.exports = { sendEmail };
