# Authentication & User Management System - Setup Guide

## Overview

I have implemented a comprehensive authentication and user management system for the Printer Asset Manager. This includes:

- ✅ User registration with email verification via OTP
- ✅ Login with JWT-based authentication
- ✅ Password reset with OTP verification
- ✅ Super Admin account for approving new users
- ✅ Role-based access control (Admin/User)
- ✅ Email notifications for issues
- ✅ User profile management with password change
- ✅ User approval/rejection interface for admins

## Database Schema Changes

New tables have been added to support authentication:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',  -- 'user' or 'admin'
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'active', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User approvals tracking
CREATE TABLE user_approvals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'
);
```

## Backend Setup

### 1. Install Dependencies

Update your backend dependencies:

```bash
cd backend
npm install bcrypt jsonwebtoken nodemailer
npm install  # to get the updated packages
```

### 2. Setup Environment Variables

Create a `.env` file in the backend directory with the following:

```env
# Port
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=printer_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production

# Email (Gmail)
EMAIL_USER=aniketbhosale1012@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# For Gmail App Password:
# 1. Go to myaccount.google.com/security
# 2. Enable 2-Factor Authentication
# 3. Create "App password" for Mail
# 4. Use that password in EMAIL_PASSWORD
```

### 3. Initialize Database

Run the updated schema.sql to create the new tables:

```bash
psql -U postgres -d printer_management -f schema.sql
```

### 4. Create Super Admin Account

After the database is initialized, use a tool like psql or a database GUI to insert the super admin:

```sql
INSERT INTO users (email, password_hash, full_name, role, status) 
VALUES (
  'aniketbhosale1012@gmail.com',
  '$2b$10$...',  -- bcrypt hash of 'Admin@1212'
  'Super Admin',
  'admin',
  'active'
);

-- You can generate the hash using Node.js:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('Admin@1212', 10).then(hash => console.log(hash));
```

Or run this command:

```bash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('Admin@1212', 10).then(hash => {
  console.log('INSERT INTO users (email, password_hash, full_name, role, status) VALUES (\\'aniketbhosale1012@gmail.com\\', \\'\\' + hash + '\\', \\'Super Admin\\', \\'admin\\', \\'active\\');');
});
"
```

### 5. Backend Routes

New routes have been added:

**Authentication Routes** (`/api/auth`):
- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Create new account (pending approval)
- `POST /auth/forgot-password` - Send OTP for password reset
- `POST /auth/reset-password` - Reset password with OTP
- `GET /auth/me` - Get current user info (requires token)
- `POST /auth/change-password` - Change password (requires token)

**Admin Routes** (`/api/admin`):
- `GET /admin/users` - List all users (admin only)
- `GET /admin/pending-approvals` - List pending approvals (admin only)
- `POST /admin/approve-user/:userId` - Approve user (admin only)
- `POST /admin/reject-user/:userId` - Reject user with reason (admin only)
- `POST /admin/change-user-role/:userId` - Change user role (admin only)
- `DELETE /admin/users/:userId` - Delete user (admin only)
- `GET /admin/all-users` - List active users (for issue assignment)

## Frontend Setup

### 1. Install Dependencies

Frontend dependencies are already included in package.json:

```bash
cd frontend
npm install
```

### 2. New Frontend Components

**Authentication Pages:**
- `src/pages/Login.jsx` - Login page
- `src/pages/Register.jsx` - Registration page
- `src/pages/ForgotPassword.jsx` - Password reset page
- `src/pages/UserProfile.jsx` - User profile and password change

**Admin Pages:**
- `src/pages/UserApprovals.jsx` - User approval management (admin only)

**Styles:**
- `src/styles/auth.css` - Authentication and modal styles

### 3. Updated Components

**AppContext** (`src/context/AppContext.jsx`):
- Now manages authentication state
- Stores user info and JWT token
- Provides `logout` and `loginUser` functions

**App.jsx**:
- Now shows login screen if not authenticated
- Includes user profile modal
- Logout button in action bar

**Sidebar.jsx**:
- Shows current user email
- User role badge (Admin/User)
- Admin-only section with User Approvals

## API Integration

### Authentication API (`utils/api.js`):

```javascript
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, confirmPassword, fullName) => ...,
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword, confirmPassword) => ...,
  getCurrentUser: (token) => api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  changePassword: (currentPassword, newPassword, confirmPassword, token) => ...,
};
```

### Admin API (`utils/api.js`):

```javascript
export const adminAPI = {
  getAllUsers: (token) => api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
  getPendingApprovals: (token) => api.get('/admin/pending-approvals', ...),
  approveUser: (userId, token) => api.post(`/admin/approve-user/${userId}`, {}, {...}),
  rejectUser: (userId, reason, token) => api.post(`/admin/reject-user/${userId}`, { reason }, {...}),
  changeUserRole: (userId, role, token) => api.post(`/admin/change-user-role/${userId}`, { role }, {...}),
  deleteUser: (userId, token) => api.delete(`/admin/users/${userId}`, {...}),
  getAllActiveUsers: (token) => api.get('/admin/all-users', {...}),
};
```

## User Workflow

### 1. New User Registration

1. User clicks "Create New Account" on login page
2. Enters email, password, and full name
3. Account is created with status "pending"
4. Admin receives and approves the account
5. User gets email notification once approved
6. User can now login

### 2. Super Admin Login

Super Admin credentials:
- Email: `aniketbhosale1012@gmail.com`
- Password: `Admin@1212`

### 3. Admin Approval Process

1. Super Admin logs in
2. Goes to "User Approvals" section (admin-only)
3. Views pending approval requests
4. Can:
   - ✅ Approve user → user gets email notification
   - ✅ Reject user with reason → user gets rejection email
   - ✅ Change user role (Admin/User)
   - ✅ Delete users

### 4. Access Control

**User Access:**
- Can view printer data
- Can report issues
- Can view assigned issues
- Cannot access admin functions

**Admin Access:**
- All user capabilities +
- Add/edit HP printers
- Use Printer Master
- Edit/add VLAN
- Approve new users
- Change user roles
- Reset other user passwords (via OTP)

### 5. Issue Assignment & Notifications

When an issue is assigned:
1. User gets email with issue details
2. Email includes: equipment, title, description, severity, location, who assigned it

When HIGH severity issue is created:
1. All active users get notified via email
2. Email includes all issue details with warning indicator

## Email Configuration

The system uses Gmail SMTP for sending emails. To configure:

### 1. Generate Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication (if not enabled)
3. Scroll down to "App passwords"
4. Select "Mail" and "Windows Computer"
5. Google will generate a 16-character password
6. Copy and paste to `EMAIL_PASSWORD` in `.env`

### 2. Email Templates

The system sends:
- **OTP Emails** - For password reset (6-digit OTP valid for 10 minutes)
- **Account Approval Emails** - When admin approves new users
- **Account Rejection Emails** - When admin rejects users (with reason)
- **Issue Assignment Emails** - When issue is assigned to user
- **High Severity Alerts** - When high severity issue is created

## Security Features

✅ **Password Security:**
- Passwords hashed with bcrypt (10 salt rounds)
- Minimum 6 characters required
- Password change requires current password verification

✅ **Token Security:**
- JWT tokens with 24-hour expiration
- Tokens stored in localStorage (frontend)
- Token required for protected endpoints

✅ **OTP Security:**
- 6-digit OTP sent via email
- Valid for 10 minutes only
- Can only be used once

✅ **Email Verification:**
- All password resets require email OTP
- All account creations require admin approval

✅ **Role-Based Access:**
- Admin-only endpoints require admin role
- Middleware checks token and role

## Testing

### Test Login Flow

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Login with:
   - Email: `aniketbhosale1012@gmail.com`
   - Password: `Admin@1212`

### Test Registration Flow

1. Click "Create New Account"
2. Enter email, password, full name
3. Account created with "pending" status
4. Login as super admin
5. Go to "User Approvals"
6. Approve the user
7. New user should receive approval email
8. New user can now login

### Test Password Reset

1. Click "Forgot Password"
2. Enter your email
3. Check email for 6-digit OTP
4. Enter OTP and new password
5. Password should be reset
6. Login with new password

### Test Issue Assignment

1. Create an issue in "Issues Tracker"
2. Assign it to a user
3. Check the user's email for assignment notification
4. Email should include issue details and who assigned it

### Test High Severity Alert

1. Create a new issue with "High" severity
2. All active users should receive alert emails
3. Email should be marked with warning indicator

## Troubleshooting

### Email not sending
- Check `.env` file has correct EMAIL_USER and EMAIL_PASSWORD
- Verify Gmail App Password is recent (regenerate if needed)
- Check if less secure apps are enabled (for some Gmail accounts)

### Token validation errors
- Ensure `JWT_SECRET` is set correctly in `.env`
- Clear localStorage and login again
- Check if token is being sent in Authorization header

### Users not visible in approval list
- Ensure users are created with status "pending"
- Check `user_approvals` table has entry for the user
- Verify admin is logged in (not regular user)

### Permissions denied errors
- Verify user has correct role in database
- Check `role` field is either 'user' or 'admin'
- Check Authorization header is being sent with requests

## Next Steps

1. ✅ Configure Gmail SMTP in `.env`
2. ✅ Create Super Admin account in database
3. ✅ Test full authentication flow
4. ✅ Deploy backend and frontend
5. ✅ Configure production JWT_SECRET
6. ✅ Monitor email delivery (check spam folder)

## File Structure

```
backend/
  ├── src/
  │   ├── middleware/
  │   │   └── auth.js              (new - auth middleware)
  │   ├── routes/
  │   │   ├── auth.js              (new - auth routes)
  │   │   ├── users.js             (new - user management)
  │   │   └── issues.js            (updated - email notifications)
  │   ├── services/
  │   │   └── emailService.js      (new - email service)
  │   └── index.js                 (updated - new routes)
  ├── schema.sql                   (updated - new tables)
  ├── package.json                 (updated - new deps)
  └── .env.template                (new - config template)

frontend/
  ├── src/
  │   ├── pages/
  │   │   ├── Login.jsx            (new)
  │   │   ├── Register.jsx         (new)
  │   │   ├── ForgotPassword.jsx   (new)
  │   │   ├── UserProfile.jsx      (new)
  │   │   ├── UserApprovals.jsx    (new)
  │   │   └── ...existing pages
  │   ├── context/
  │   │   └── AppContext.jsx       (updated)
  │   ├── components/
  │   │   ├── Sidebar.jsx          (updated)
  │   │   └── ...existing components
  │   ├── styles/
  │   │   └── auth.css             (new)
  │   ├── utils/
  │   │   └── api.js               (updated - auth APIs)
  │   ├── App.jsx                  (updated)
  │   └── ...existing files
  └── ...existing config files
```

---

**System is now ready for authentication and user management!** 🎉
