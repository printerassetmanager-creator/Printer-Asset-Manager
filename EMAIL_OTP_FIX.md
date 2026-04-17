# 🔧 EMAIL OTP FIX GUIDE - AWS
## Troubleshooting "Unable to get mail OTP via AWS"

---

## 🔍 PROBLEM DIAGNOSIS

**What's happening:**
- User requests OTP (Registration/Password Reset)
- No email is received
- Backend runs without errors
- Issue only happens on AWS


**Root Causes:**
1. ❌ Gmail SMTP blocked on AWS (port 587/465)
2. ❌ Email credentials not set in backend .env
3. ❌ Gmail App Password incorrect
4. ❌ Email service not initialized
5. ❌ AWS SES not configured (better option)

---

## ✅ SOLUTION 1: FIX GMAIL CONFIGURATION (Quick)

### 1.1 Verify Your .env File

On your AWS instance, check:
```bash
cd /home/ubuntu/Printer-Asset-Manager/backend
cat .env | grep EMAIL
```

Should show:
```
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_16_char_app_password
```

### 1.2 Get Gmail App Password (If Missing)

**On your local computer:**

1. Go to Google Account: https://myaccount.google.com
2. Click "Security" (left sidebar)
3. Scroll to "App passwords"
4. Select Device: **Windows Computer**
5. Select App: **Mail**
6. Google generates 16-char password
7. Copy this password

**Example:** `abcd efgh ijkl mnop` (remove spaces)

### 1.3 Update Backend .env on AWS

```bash
# On AWS instance
cd /home/ubuntu/Printer-Asset-Manager/backend

# Update .env
sudo cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=postgres
DB_PASSWORD=pass
DB_NAME=printer_ms
EMAIL_USER=your_email@gmail.com
APP_PASSWORD=your_16_char_password_here
NODE_ENV=production
JWT_SECRET=your_jwt_secret
EOF

# Verify
cat .env | grep EMAIL
```

### 1.4 Restart Backend

```bash
pm2 restart printer-backend
pm2 logs printer-backend
```

Check for:
```
Email service ready: true
```

---

## ✅ SOLUTION 2: USE AWS SES (RECOMMENDED)

AWS SES (Simple Email Service) is more reliable on AWS instances.

### 2.1 Setup AWS SES

**On AWS Console:**

1. Go to **SES (Simple Email Service)**
2. Click **Domains** (left sidebar)
3. Click **Verify a New Domain**
4. Enter your domain: `yourdomain.com`
5. Add DNS records AWS gives you
6. Wait 15 min for verification

**OR use Email (if no domain):**
1. Go to **Email Addresses**
2. Click **Verify a New Email Address**
3. Verify by clicking link in email

### 2.2 Create IAM Credentials for SES

```
1. Go to IAM → Users → Create User
2. Username: printer-ses-user
3. Attach Policy: AmazonSesSendingAccess
4. Create Access Key
5. Save: Access Key ID + Secret Access Key
```

### 2.3 Install AWS SDK

On AWS instance:
```bash
cd /home/ubuntu/Printer-Asset-Manager/backend
npm install aws-sdk
```

### 2.4 Create AWS SES Email Service

```bash
# Backup old service
cp src/services/emailService.js src/services/emailService.js.bak

# Create new SES version
cat > src/services/emailService.js << 'EOF'
const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const assertEmailConfig = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    const error = new Error('AWS credentials not configured. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to backend/.env');
    error.code = 'AWS_NOT_CONFIGURED';
    throw error;
  }
};

const sendOTP = async (email, otp) => {
  try {
    assertEmailConfig();
    
    const params = {
      Source: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Password Reset OTP - Printer Asset Manager' },
        Body: {
          Html: {
            Data: `
              <h2>Password Reset Request</h2>
              <p>Your OTP for password reset is:</p>
              <h1 style="letter-spacing: 5px; color: #007bff;">${otp}</h1>
              <p>This OTP is valid for 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            `
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    throw error;
  }
};

const sendRegistrationOTP = async (email, otp) => {
  try {
    assertEmailConfig();
    
    const params = {
      Source: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Email Verification OTP - Printer Asset Manager' },
        Body: {
          Html: {
            Data: `
              <h2>Email Verification</h2>
              <p>Use this OTP to verify your email address:</p>
              <h1 style="letter-spacing: 5px; color: #007bff;">${otp}</h1>
              <p>This OTP is valid for 10 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            `
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    console.log(`Registration OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending registration OTP:', error.message);
    throw error;
  }
};

const sendAccountApprovalNotification = async (email, fullName) => {
  try {
    assertEmailConfig();
    
    const params = {
      Source: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Account Approved - Printer Asset Manager' },
        Body: {
          Html: {
            Data: `
              <h2>Welcome, ${fullName}!</h2>
              <p>Your account has been approved by the administrator.</p>
              <p>You can now log in to the Printer Asset Manager.</p>
              <a href="https://yourdomain.com/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
            `
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    console.log(`Approval notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending approval notification:', error.message);
    throw error;
  }
};

module.exports = { sendOTP, sendRegistrationOTP, sendAccountApprovalNotification };
EOF
```

### 2.5 Update .env for AWS SES

```bash
cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_ms
DB_USER=postgres
DB_PASSWORD=pass
EMAIL_USER=noreply@yourdomain.com
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
NODE_ENV=production
JWT_SECRET=your_jwt_secret
EOF
```

### 2.6 Restart Backend

```bash
cd /home/ubuntu/Printer-Asset-Manager/backend
pm2 restart printer-backend
pm2 logs printer-backend
```

---

## 🧪 TEST EMAIL SERVICE

### Test 1: Check Backend Logs

```bash
pm2 logs printer-backend | grep -i email
```

**Should see:**
```
Email service ready: true
```

### Test 2: Request OTP from Frontend

1. Go to: http://your_domain.com/forgot-password
2. Enter your email
3. Click "Send OTP"
4. Check logs:

```bash
tail -f /var/log/pm2/printer-backend-error.log
tail -f /var/log/pm2/printer-backend-out.log
```

### Test 3: Manual Test (if needed)

```bash
# SSH to AWS instance
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

# Test email sending
cd /home/ubuntu/Printer-Asset-Manager/backend
node -e "
require('dotenv').config();
const email = require('./src/services/emailService.js');
email.sendOTP('your_email@gmail.com', '123456')
  .then(() => console.log('Success!'))
  .catch(err => console.error('Error:', err.message));
"
```

---

## 🔍 TROUBLESHOOTING

### Issue: "Email service warning: connect ECONNREFUSED"

**Cause:** Gmail SMTP port 587 blocked on AWS

**Solution:** Use AWS SES instead (Section 2)

```
Try:
1. Change to AWS SES (recommended)
2. Or use different email provider (SendGrid, Mailgun)
```

### Issue: "Invalid login: Invalid credentials"

**Cause:** App password incorrect

**Solution:**
1. Go to https://myaccount.google.com
2. Security → App passwords
3. Generate NEW app password
4. Copy exactly (16 characters)
5. Update .env
6. Restart backend

**Verify app password:**
```bash
# Check .env
cat .env | grep APP_PASSWORD

# It should be 16 characters with NO SPACES
```

### Issue: "Sender email not verified in SES"

**Cause:** Using AWS SES but email not verified

**Solution:**
```
1. Go to AWS SES → Email Addresses
2. Click "Verify a New Email Address"
3. Verify by email link
4. Use verified email in EMAIL_USER
```

### Issue: Backend starts but no "Email service ready" message

**Cause:** Service not initializing

**Solution:**
```bash
# Check .env has email credentials
cat .env | grep EMAIL

# Check service file
cat src/services/emailService.js | head -20

# Restart with detailed logging
pm2 restart printer-backend
pm2 logs printer-backend --lines 50
```

---

## 📋 QUICK CHECKLIST

### For Gmail Solution:
- [ ] Gmail App Password generated (16 chars)
- [ ] .env has EMAIL_USER and APP_PASSWORD
- [ ] Backend restarted after .env change
- [ ] Can see "Email service ready: true" in logs
- [ ] Test OTP sent successfully

### For AWS SES Solution:
- [ ] Domain verified in SES (or email verified)
- [ ] IAM credentials created
- [ ] aws-sdk installed
- [ ] .env has AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- [ ] emailService.js updated to use AWS SDK
- [ ] Backend restarted
- [ ] Test OTP sent successfully

---

## 🚀 RECOMMENDED APPROACH

**Use AWS SES** if you're on AWS because:
✅ No port blocking issues
✅ Better reliability
✅ Costs less ($0.10 per 1000 emails)
✅ Native AWS integration
✅ Higher sending limits

**Use Gmail** if:
✅ Quick setup needed
✅ Testing locally
✅ Small email volume

---

## 📞 IMPLEMENTATION STEPS

**Choose your path:**

### Path A: Fix Gmail (5 minutes)
1. Get app password from Google
2. Update .env
3. Restart backend
4. Test

### Path B: Setup AWS SES (15 minutes)
1. Verify domain/email in SES
2. Create IAM credentials
3. Install aws-sdk
4. Update emailService.js
5. Update .env
6. Restart backend
7. Test

**Start with Path A for quick fix, then switch to Path B for production.**

---

**Let me know which path you choose and if you hit any issues!** 🚀
