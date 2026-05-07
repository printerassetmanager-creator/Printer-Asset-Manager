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

if (process.env.NODE_ENV !== 'test') {
  // Verify transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.warn('Email service warning:', error.message);
    } else {
      console.log('Email service ready:', success);
    }
  });
}

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
      subject: `🔴 Issue Assigned to You - "${issueDetails.title}" - Printer Asset Manager`,
      html: `
        <h2 style="color: #e05252;">New Issue Assignment</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>A new issue has been assigned to you that requires your immediate attention:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #ddd;">
          <tr style="border: 1px solid #ddd;background: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Printer/Equipment:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;"><strong>${issueDetails.pmno || issueDetails.serial || 'N/A'}</strong></td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Issue Title:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;"><strong>${issueDetails.title}</strong></td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Description:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;">${issueDetails.desc}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Severity:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;"><span style="color: ${issueDetails.severity === 'High' ? '#e05252' : issueDetails.severity === 'Medium' ? '#f59e0b' : '#10b981'}; font-weight: bold;">${issueDetails.severity}</span></td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Location:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;">${issueDetails.loc}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Category:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;">${issueDetails.category}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Time Remaining:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;"><strong>${issueDetails.timeRemaining}</strong></td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: bold; background: #f2f2f2; width: 25%;">Assigned By:</td>
            <td style="padding: 12px; border-left: 1px solid #ddd;">${issueDetails.assignedBy || 'System'}</td>
          </tr>
        </table>
        <p style="color: #666;">Please review this issue and take necessary action at your earliest convenience.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This is an automated notification from Printer Asset Manager. Please do not reply to this email.</p>
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

const sendApplicationSupportMonitorAlert = async (emails, alertDetails) => {
  try {
    assertEmailConfig();
    const emailList = Array.isArray(emails) ? emails.filter(Boolean) : [emails].filter(Boolean);
    if (emailList.length === 0) {
      return;
    }

    const resultRows = `
      <tr style="background: #f2f2f2;">
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Terminal</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Status</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Attempts</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Elapsed ms</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Error</th>
      </tr>
      ${alertDetails.results.map(result => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${result.terminalLabel || result.terminalCode || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${result.status}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${result.attemptCount || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${result.elapsedMs || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${result.error || '-'}</td>
        </tr>
      `).join('')}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: emailList.join(','),
      subject: alertDetails.critical
        ? `Critical Monitor Terminal Alert - ${alertDetails.status || 'issue detected'}`
        : `Monitor Terminal Alert - ${alertDetails.status || 'issue detected'}`,
      html: `
        <h2 style="color: #d32f2f;">${alertDetails.critical ? 'Critical Monitor Terminal Alert' : 'Monitor Terminal Alert'}</h2>
        <p>Monitor terminal automation detected an issue at <strong>${alertDetails.alertTime || new Date().toLocaleString()}</strong>.</p>
        <p><strong>Status:</strong> ${alertDetails.status || 'unknown'}</p>
        <p><strong>Attempt Count:</strong> ${alertDetails.attemptCount || 0}</p>
        <p><strong>Elapsed Time:</strong> ${alertDetails.elapsedMs || 0} ms</p>
        ${alertDetails.message ? `<p style="font-weight: 700; color: #d32f2f;">${alertDetails.message}</p>` : ''}
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">${resultRows}</table>
        <p style="color: #555;">Please verify RDP credentials and remote desktop configuration.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This alert is sent when the monitor terminal process detects a terminal open failure.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Monitor terminal alert sent to ${emailList.length} users`);
  } catch (error) {
    console.error('Error sending application support monitor alert:', error);
    throw error;
  }
};

const sendApplicationSupportTerminalLoadAlert = async (emails, alertDetails) => {
  try {
    assertEmailConfig();
    const emailList = Array.isArray(emails) ? emails.filter(Boolean) : [emails].filter(Boolean);
    if (emailList.length === 0) {
      return;
    }

    const hotTerminalRows = alertDetails.terminals.map((terminal) => {
      const serverRows = terminal.servers.map((server) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${server.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${server.active_users || 0}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${server.status || 'unknown'}</td>
        </tr>
      `).join('');

      return `
        <h3 style="color: #d32f2f; margin: 22px 0 8px;">${terminal.code} - ${terminal.name}</h3>
        <p style="margin: 0 0 10px;"><strong>Total Active Users:</strong> ${terminal.total_users}</p>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 18px;">
          <thead>
            <tr style="background: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Server</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Active Users</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>${serverRows}</tbody>
        </table>
      `;
    }).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: emailList.join(','),
      subject: `Terminal Load Needs Attention - ${alertDetails.terminals.length} terminal(s) at 30+ users`,
      html: `
        <h2 style="color: #d32f2f;">Terminal Load Needs Attention</h2>
        <p>One or more application support terminals have reached 30+ active users.</p>
        <p><strong>Alert Time:</strong> ${alertDetails.alertTime}</p>
        <p><strong>Total Active Users Across Hot Terminals:</strong> ${alertDetails.totalUsers}</p>
        ${hotTerminalRows}
        <p style="color: #d32f2f; font-weight: bold;">Please review terminal load and take necessary action.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This scheduled alert is sent at 6:00 AM, 2:00 PM, 6:00 PM, and 10:00 PM when terminal load is 30+ users.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Application support terminal load alert sent to ${emailList.length} users`);
  } catch (error) {
    console.error('Error sending application support terminal load alert:', error);
    throw error;
  }
};

const sendApplicationSupportTerminalRecoveryAlert = async (emails, recoveryDetails) => {
  try {
    assertEmailConfig();
    const emailList = Array.isArray(emails) ? emails.filter(Boolean) : [emails].filter(Boolean);
    if (emailList.length === 0) {
      return;
    }

    const recoveryRows = recoveryDetails.terminals.map((terminal) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${terminal.code}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${terminal.total_users}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER || 'aniketbhosale1012@gmail.com',
      to: emailList.join(','),
      subject: `Terminal Load Normalized - ${recoveryDetails.terminals.length} terminal(s) back to normal`,
      html: `
        <h2 style="color: #22c55e;">Terminal Load Normalized</h2>
        <p>The following application support terminal(s) are now below the 30-user max limit again:</p>
        <p><strong>Recovery Time:</strong> ${recoveryDetails.recoveryTime}</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <thead>
            <tr style="background: #f2fdf6;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Terminal</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Active Users</th>
            </tr>
          </thead>
          <tbody>${recoveryRows}</tbody>
        </table>
        <p style="color: #16a34a; font-weight: bold;">This terminal load has returned to normal levels and server performance should no longer be affected.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This notification is sent once when terminal load returns below the configured threshold.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Application support terminal recovery alert sent to ${emailList.length} users`);
  } catch (error) {
    console.error('Error sending application support terminal recovery alert:', error);
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
  sendApplicationSupportMonitorAlert,
  sendApplicationSupportTerminalLoadAlert,
  sendApplicationSupportTerminalRecoveryAlert,
};
