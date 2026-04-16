const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
    pass: process.env.EMAIL_PASSWORD || process.env.APP_PASSWORD, // Use app-specific password for Gmail
  },
});

const assertEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD || process.env.APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    const error = new Error('Email service is not configured. Add EMAIL_USER and EMAIL_PASSWORD or APP_PASSWORD to backend/.env');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }
};

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.warn('Email service warning:', error.message);
  } else {
    console.log('Email service ready:', success);
  }
});

const sendOTP = async (email, otp) => {
  try {
    assertEmailConfig();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: email,
      subject: 'Password Reset OTP - Printer Asset Manager',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="letter-spacing: 5px; color: #007bff;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

const sendRegistrationOTP = async (email, otp) => {
  try {
    assertEmailConfig();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: email,
      subject: 'Email Verification OTP - Printer Asset Manager',
      html: `
        <h2>Email Verification</h2>
        <p>Use this OTP to verify your email address and create your Printer Asset Manager account:</p>
        <h1 style="letter-spacing: 5px; color: #007bff;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request account creation, please ignore this email.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Registration OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending registration OTP:', error);
    throw error;
  }
};

const sendAccountApprovalNotification = async (email, fullName) => {
  try {
    assertEmailConfig();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: email,
      subject: 'Account Approved - Printer Asset Manager',
      html: `
        <h2>Welcome to Printer Asset Manager!</h2>
        <p>Hello ${fullName},</p>
        <p>Your account has been approved by the Super Admin.</p>
        <p>You can now login with your email and password.</p>
        <p><strong>Login Email:</strong> ${email}</p>
        <br/>
        <p>If you have any questions, please contact the administrator.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Approval notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending approval notification:', error);
    throw error;
  }
};

const sendAccountRejectionNotification = async (email, fullName, reason) => {
  try {
    assertEmailConfig();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: email,
      subject: 'Account Request - Update - Printer Asset Manager',
      html: `
        <h2>Account Request Update</h2>
        <p>Hello ${fullName},</p>
        <p>Your account request has been reviewed by the Super Admin.</p>
        <p><strong>Status:</strong> Not Approved</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please contact the administrator for more information.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Rejection notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending rejection notification:', error);
    throw error;
  }
};

const sendIssueAssignmentNotification = async (email, userName, issueDetails) => {
  try {
    assertEmailConfig();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: email,
      subject: `Issue Assigned to You - Printer Asset Manager`,
      html: `
        <h2>New Issue Assignment</h2>
        <p>Hello ${userName},</p>
        <p>A new issue has been assigned to you:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Printer/Equipment:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.pmno || issueDetails.serial || 'N/A'}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Issue Title:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.title}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Description:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.desc}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Severity:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.severity}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Location:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.loc}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Assigned By:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.reportedBy || 'System'}</td>
          </tr>
        </table>
        <p>Please review and take necessary action.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Issue assignment notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending issue assignment notification:', error);
    throw error;
  }
};

const sendHighSeverityIssueAlert = async (emails, issueDetails) => {
  try {
    assertEmailConfig();
    const emailList = Array.isArray(emails) ? emails : [emails];
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: emailList.join(','),
      subject: `⚠️ HIGH SEVERITY Issue Created - Printer Asset Manager`,
      html: `
        <h2 style="color: #d32f2f;">⚠️ HIGH SEVERITY ISSUE ALERT</h2>
        <p>A high severity issue has been created in the system:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 2px solid #d32f2f;">
          <tr style="border: 1px solid #ddd; background: #ffebee;">
            <td style="padding: 10px; font-weight: bold; background: #d32f2f; color: white; width: 30%;">Printer/Equipment:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.pmno || issueDetails.serial || 'N/A'}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Issue Title:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.title}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Description:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.desc}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Severity:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd; color: #d32f2f; font-weight: bold;">HIGH</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Location:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.loc}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Category:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.category}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold; background: #f2f2f2; width: 30%;">Reported By:</td>
            <td style="padding: 10px; border-left: 1px solid #ddd;">${issueDetails.reportedBy || 'System'}</td>
          </tr>
        </table>
        <p style="color: #d32f2f;">Please take immediate action on this high severity issue.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`High severity alert sent to ${emailList.length} users`);
  } catch (error) {
    console.error('Error sending high severity alert:', error);
    throw error;
  }
};

module.exports = {
  sendOTP,
  sendRegistrationOTP,
  sendAccountApprovalNotification,
  sendAccountRejectionNotification,
  sendIssueAssignmentNotification,
  sendHighSeverityIssueAlert,
};
