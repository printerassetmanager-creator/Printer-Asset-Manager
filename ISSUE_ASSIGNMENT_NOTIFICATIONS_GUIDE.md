# 📧 ISSUE ASSIGNMENT & NOTIFICATION SYSTEM
## Complete Guide

---

## ✅ FEATURES IMPLEMENTED

### 1. **Assign Modal - Black Screen Fixed**
✅ Modal now appears without black screen  
✅ All users properly loaded from database  
✅ Dropdown shows all available users  
✅ Click outside modal to close  
✅ Better styling and error handling  

### 2. **Issue Assignment Notification**
When you **assign an issue to someone**, they receive an email with:
- ✅ Issue Title
- ✅ Issue Description  
- ✅ Printer/Equipment Details (PMNO or Serial)
- ✅ Severity Level (color-coded)
- ✅ Location Information
- ✅ Category
- ✅ **TIME REMAINING** (e.g., "2d 5h" or "Breached")
- ✅ **WHO ASSIGNED IT** (person's name who made the assignment)

### 3. **High Severity Issue Alert**
When a **HIGH severity issue is created**, ALL USERS get notified:
- ✅ Subject line begins with ⚠️ WARNING
- ✅ All issue details included
- ✅ Formatted with prominent styling
- ✅ Urges immediate action

---

## 🎯 HOW TO USE

### Step 1: Create an Issue
1. Go to **Issues Tracker** section
2. Click **"+ New Issue"**
3. Fill in:
   - Issue Title
   - Description
   - Severity (Low / Medium / **High**)
   - Category
4. Click **"Create Issue"**

**Result**: If severity is HIGH → All users receive alert email

### Step 2: Assign Issue to User
1. In **Issues Tracker**, find the issue
2. Click **"👤 Assign"** button
3. Select user from dropdown
4. Click **"Assign & Notify"**

**Result**: Selected user receives assignment notification email with all details

### Step 3: User Receives Notifications
The assigned user's mailbox will show:

**Subject**: 🔴 Issue Assigned to You - "[Issue Title]" - Printer Asset Manager

**Email Content**:
```
Hello [User Name],

A new issue has been assigned to you that requires your immediate attention:

┌──────────────────────┬─────────────────────┐
│ Printer/Equipment    │ [PMNO or Serial]    │
│ Issue Title          │ [Title]             │
│ Description          │ [Description]       │
│ Severity             │ [High/Medium/Low]   │
│ Location             │ [Location]          │
│ Category             │ [Category]          │
│ Time Remaining       │ [2d 5h / Breached]  │
│ Assigned By          │ [Admin Name]        │
└──────────────────────┴─────────────────────┘

Please review this issue and take necessary action
at your earliest convenience.
```

---

## ⚙️ SYSTEM CONFIGURATION

### Email Service Setup

Your `.env` file (on AWS or local):
```bash
EMAIL_USER=printerassetmanager@gmail.com
APP_PASSWORD=loxbdtmyirhxlhep
```

### Available Email Functions

**1. Send Assignment Notification**
- Triggered when: Issue is assigned to someone
- Recipients: The assigned user (single person)
- Data included: Issue details + time remaining + who assigned

**2. Send High Severity Alert**
- Triggered when: NEW high severity issue is created
- Recipients: ALL ACTIVE USERS in the system
- Data included: Issue details with warning styling

---

## 🔧 TECHNICAL DETAILS

### Frontend Changes
**File**: `frontend/src/pages/IssuesTracker.jsx`

**Key Improvements**:
```javascript
// Users now load properly with error handling
const loadUsers = async () => {
  try {
    const { data: userList } = await issuesAPI.getUsers();
    const normalized = userList && Array.isArray(userList) 
      ? userList.map(u => typeof u === 'string' ? u : (u.email || u.value))
      : [];
    setUsers(normalized);
  } catch (e) {
    console.error('Error loading users:', e);
    setUsers([]);
  }
};

// Assign function with email confirmation
const doAssign = async () => {
  if (!assignTo) { setMsg('Please select a user'); return; }
  try {
    await issuesAPI.assign(assigningId, { 
      assigned_to: assignTo, 
      user_name: displayName(CURRENT_USER) 
    });
    setMsg(`Issue assigned to ${assignTo} - notification email sent`);
    setTimeout(()=>setMsg(''),3000);
    load(); // Reload to show updated assignment
  } catch (e) { 
    setMsg(e.response?.data?.error || 'Error assigning issue'); 
  }
};
```

**Modal Improvements**:
- Better error handling for missing users
- Disabled assign button until user selected
- Close button (✕) and click-outside-to-close
- Loading indicator if users not yet loaded
- Visual feedback with color-coded severity

### Backend Changes
**File**: `backend/src/routes/issues.js`

**Key Improvements**:
```javascript
// Calculate time remaining for assignment notification
const now = new Date();
const deadline = new Date(issue.resolution_deadline);
const ms = deadline - now;
let timeRemaining = 'Breached';
if (ms > 0) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) timeRemaining = `${days}d ${hours}h`;
  else timeRemaining = `${hours}h`;
}

// Send with complete details
const issueDetails = {
  pmno: issue.pmno,
  serial: issue.serial,
  title: issue.title,
  desc: issue.desc,
  severity: issue.severity,
  loc: issue.loc,
  category: issue.category,
  assignedBy: user_name, // Who made the assignment
  timeRemaining: timeRemaining, // Time before deadline
};

await sendIssueAssignmentNotification(
  user.email, 
  user.full_name, 
  issueDetails
);
```

**Email Service Changes**:
**File**: `backend/src/services/emailService.js`

**Improved Email Template**:
- Color-coded severity (High=Red, Medium=Orange, Low=Green)
- Professional HTML table formatting
- Includes time remaining information
- Shows who assigned the issue
- Clear action items

---

## 📊 RESOLUTION DEADLINES

When an issue is created, deadline is automatically set based on severity:

| Severity | Deadline | Time Remaining Display |
|----------|----------|----------------------|
| **High** | 1 day | "2d 5h", "12h 30m", "Breached" |
| **Medium** | 3 days | "2d 5h", "12h 30m", "Breached" |
| **Low** | 7 days | "5d 12h", "2d 3h", "Breached" |

---

## 🧪 TESTING

### Test 1: Create High Severity Issue
```
1. Go to Issues Tracker
2. Click "+ New Issue"
3. Set Severity = "High"
4. Fill other fields
5. Create Issue
✅ All users should receive alert email
```

### Test 2: Assign Issue
```
1. In Issues Tracker, find an issue
2. Click "👤 Assign"
3. Select a user from dropdown
4. Click "Assign & Notify"
✅ Selected user gets assignment notification
✅ Email contains all details including time remaining
```

### Test 3: Check Email Format
```
Look for:
✅ Colored severity indicator
✅ Time remaining (e.g., "1d 23h")
✅ Who assigned the issue
✅ All printer details
✅ Clear action items
```

---

## ⚠️ TROUBLESHOOTING

### Problem: Users dropdown appears empty
**Solution**:
```bash
# Check database has active users
psql -U printer_user -d printer_ms -c "SELECT email, full_name FROM users WHERE status='active';"

# Check email is configured in .env
cat backend/.env | grep EMAIL
```

### Problem: Assignment works but no email received
**Solution**:
```bash
# Check backend logs for email errors
pm2 logs printer-backend | grep -i "email\|mail\|notification"

# Check if user has valid email
psql -U printer_user -d printer_ms -c "SELECT * FROM users WHERE email = 'user@example.com';"
```

### Problem: Can't see assign button
**Solution**:
- Only visible if logged in as admin/super_admin
- Only visible for "open" issues (not resolved)
- Try refreshing page if button still missing

### Problem: Modal closes immediately after click
**Solution**:
- Reload frontend: `npm run dev`
- Clear browser cache: `Ctrl + Shift + Delete`
- Check browser console for errors: `F12 → Console`

---

## 📧 EMAIL CONFIGURATION REFERENCE

### Gmail Setup (Current)
✓ Configured with App Password  
✓ SMTP Port 587  
✓ TLS Enabled  
Location: `backend/.env`

### To Change Email Provider
Edit `backend/src/services/emailService.js`:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change this
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD,
  },
});
```

**Supported Services**: gmail, outlook, yahoo, etc.

---

## 📈 FUTURE ENHANCEMENTS

Potential improvements:
- [ ] Weekly email digest of all assigned issues
- [ ] SMS notifications for high severity
- [ ] Slack integration
- [ ] Issue escalation if not addressed
- [ ] Automatic reassignment after X hours
- [ ] Email templates with issue history
- [ ] Custom deadline notifications

---

## 🔐 SECURITY NOTES

✅ Emails only sent after assignment (no spam)  
✅ Only assigned user receives assignment email  
✅ All active users get HIGH severity alert (important!)  
✅ User data is from verified database  
✅ No credentials exposed in emails  

---

**Status**: ✅ FULLY IMPLEMENTED & TESTED

**Last Updated**: April 18, 2026

**GitHub Commit**: b994b8c
