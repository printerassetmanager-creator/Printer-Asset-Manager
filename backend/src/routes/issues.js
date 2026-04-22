const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { sendIssueAssignmentNotification, sendHighSeverityIssueAlert } = require('../services/emailService');

function generateIssueUniqueId(issueId) {
  return `ISSU${String(issueId).padStart(2, '0')}`;
}

// Calculate resolution deadline based on severity
function getResolutionDeadline(severity) {
  const deadlines = {
    'High': 1,      // 1 day
    'Medium': 3,    // 3 days
    'Low': 7        // 7 days
  };
  const days = deadlines[severity] || 7;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

// Calculate days/hours remaining until deadline
function getTimeRemaining(deadline) {
  const now = new Date();
  const ms = new Date(deadline) - now;
  if (ms <= 0) return { isBreached: true, display: 'Breached' };
  
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  if (days > 0) return { isBreached: false, display: `${days}d ${hours}h` };
  if (hours > 0) return { isBreached: false, display: `${hours}h ${minutes}m` };
  return { isBreached: false, display: `${minutes}m` };
}

router.get('/', async (req, res) => {
  try {
    // Auto-delete issues: only non-high severity after 10 days. High severity issues are stored permanently.
    await pool.query(`
      DELETE FROM issues 
      WHERE (severity != 'High' AND expires_at < NOW())
    `);
    
    const { plants } = req.query;
    let query = 'SELECT * FROM issues';
    const params = [];
    if (plants) {
      const plantList = plants.split(',').map((p) => p.trim());
      query += ' WHERE plant_location = ANY($1)';
      params.push(plantList);
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    
    // Add timeline info to each issue
    const enriched = rows.map(issue => ({
      ...issue,
      timeRemaining: getTimeRemaining(issue.resolution_deadline || issue.created_at)
    }));
    
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { pmno, serial, model, loc, title, desc, severity, category, reporter, sapno, mesno, plant_location, user_name, user_email, assigned_to, assignment_note } = req.body;
  
  // For Medium/Low severity issues, assignment is mandatory during creation
  if ((severity === 'Medium' || severity === 'Low')) {
    if (!assigned_to || !assigned_to.trim()) {
      return res.status(400).json({ error: 'Assignment is required for Medium/Low severity issues' });
    }
    if (!user_email || !user_email.trim()) {
      return res.status(400).json({ error: 'Current user email is required for assignment' });
    }
  }
  
  try {
    const deadline = getResolutionDeadline(severity);
    const { rows } = await pool.query(
      `INSERT INTO issues (pmno,serial,model,loc,title,"desc",severity,category,reporter,sapno,mesno,plant_location,resolution_deadline,status_changed_at,last_activity_user,assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),$14,$15) RETURNING *`,
      [pmno, serial, model, loc, title, desc, severity||'Medium', category||'Other', reporter, sapno, mesno, plant_location||'B26', deadline, user_name||'system', assigned_to || null]
    );
    let issue = rows[0];
    
    // Generate unique issue ID
    try {
      const uniqueId = generateIssueUniqueId(issue.id);
      const { rows: updatedRows } = await pool.query(
        `UPDATE issues SET issue_unique_id = $1 WHERE id = $2 RETURNING *`,
        [uniqueId, issue.id]
      );
      issue = updatedRows[0];
    } catch (idError) {
      console.error('Error setting issue_unique_id:', idError);
      // Continue without unique ID - it's not critical
    }
    
    // Log create activity
    await pool.query(
      `INSERT INTO issue_activity_log (issue_id, activity_type, new_severity, severity_at_time, user_name, assigned_to, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [issue.id, 'created', severity||'Medium', severity||'Medium', user_name||'system', assigned_to || null, assignment_note || '']
    );
    
    // Handle notifications based on severity
    if (severity === 'High') {
      // Send notification to all users for high severity
      try {
        const usersResult = await pool.query('SELECT email, full_name FROM users WHERE status = $1', ['active']);
        const emails = usersResult.rows.map(u => u.email);
        
        if (emails.length > 0) {
          const issueDetails = {
            pmno: issue.pmno,
            serial: issue.serial,
            title: issue.title,
            desc: issue.desc,
            severity: issue.severity,
            loc: issue.loc,
            category: issue.category,
            reportedBy: reporter || user_name || 'System',
          };
          
          await sendHighSeverityIssueAlert(emails, issueDetails);
        }
      } catch (emailError) {
        console.error('Error sending high severity alert:', emailError);
        // Don't fail the request if email fails
      }
    } else if ((severity === 'Medium' || severity === 'Low') && assigned_to) {
      // Send assignment notification for Medium/Low severity
      try {
        const userResult = await pool.query(
          'SELECT email, full_name FROM users WHERE email = $1 OR full_name = $1',
          [assigned_to]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          const now = new Date();
          const deadline = new Date(issue.resolution_deadline || issue.created_at);
          const ms = deadline - now;
          let timeRemaining = 'Breached';
          if (ms > 0) {
            const days = Math.floor(ms / 86400000);
            const hours = Math.floor((ms % 86400000) / 3600000);
            if (days > 0) timeRemaining = `${days}d ${hours}h`;
            else timeRemaining = `${hours}h`;
          }

          const issueDetails = {
            pmno: issue.pmno,
            serial: issue.serial,
            title: issue.title,
            desc: issue.desc,
            severity: issue.severity,
            loc: issue.loc,
            category: issue.category,
            reportedBy: user_name || 'System',
            assignedBy: user_name || 'System',
            timeRemaining: timeRemaining,
          };

          await sendIssueAssignmentNotification(user.email, user.full_name, issueDetails);
        }
      } catch (emailError) {
        console.error('Error sending assignment notification:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.status(201).json(issue);
  } catch (e) { 
    console.error('Issue creation error:', e);
    res.status(500).json({ error: e.message }); 
  }
});

router.put('/:id', async (req, res) => {
  const { pmno, serial, model, loc, title, desc, severity, category, reporter, sapno, mesno, plant_location } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE issues SET pmno=$1,serial=$2,model=$3,loc=$4,title=$5,"desc"=$6,severity=$7,category=$8,reporter=$9,sapno=$10,mesno=$11,plant_location=$12 WHERE id=$13 RETURNING *`,
      [pmno, serial, model, loc, title, desc, severity, category, reporter, sapno, mesno, plant_location||'B26', req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get issue activity history
router.get('/:id/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT *, created_at AS activity_at FROM issue_activity_log WHERE issue_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Resolve issue - action_taken is mandatory
router.put('/:id/resolve', async (req, res) => {
  const { action_taken, user_name } = req.body;
  if (!action_taken || !action_taken.trim()) {
    return res.status(400).json({ error: 'Action taken is mandatory when resolving an issue' });
  }
  
  try {
    const { rows: issues } = await pool.query('SELECT * FROM issues WHERE id=$1', [req.params.id]);
    if (!issues.length) return res.status(404).json({ error: 'Issue not found' });
    
    const issue = issues[0];
    const { rows } = await pool.query(
      `UPDATE issues SET status='resolved', resolved_at=NOW(), action=$1, severity_at_resolve=$2, last_activity_user=$3 WHERE id=$4 RETURNING *`,
      [action_taken, issue.severity, user_name||'system', req.params.id]
    );
    
    // Log resolve activity
    await pool.query(
      `INSERT INTO issue_activity_log (issue_id, activity_type, severity_at_time, action_taken, user_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, 'resolved', issue.severity, action_taken, user_name||'system']
    );
    
    res.json(rows[0]);
  } catch (e) { 
    console.error('Issue resolve error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Downgrade severity - reason is mandatory
router.put('/:id/downgrade', async (req, res) => {
  const { new_severity, reason, user_name } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is mandatory when downgrading severity' });
  }
  
  try {
    const { rows: issues } = await pool.query('SELECT * FROM issues WHERE id=$1', [req.params.id]);
    if (!issues.length) return res.status(404).json({ error: 'Issue not found' });
    
    const issue = issues[0];
    const currentSeverity = issue.severity;
    const oldSeverity = currentSeverity;
    const allowedDowngrades = currentSeverity === 'High' ? ['Medium', 'Low'] : currentSeverity === 'Medium' ? ['Low'] : [];

    if (new_severity === currentSeverity) {
      return res.status(400).json({ error: `Issue is already ${currentSeverity}.` });
    }
    if (!allowedDowngrades.includes(new_severity)) {
      if (allowedDowngrades.length === 0) {
        return res.status(400).json({ error: 'Low severity issues cannot be downgraded.' });
      }
      return res.status(400).json({ error: `Can only downgrade ${currentSeverity} issues to: ${allowedDowngrades.join(' or ')}.` });
    }
    
    // Restart countdown from original creation time when downgrading
    const days = new_severity === 'High' ? 1 : new_severity === 'Medium' ? 3 : 7;
    const deadline = new Date(issue.created_at);
    deadline.setDate(deadline.getDate() + days);
    const { rows } = await pool.query(
      `UPDATE issues SET severity=$1, status_changed_at=created_at, resolution_deadline=$2, last_activity_user=$3 WHERE id=$4 RETURNING *`,
      [new_severity, deadline, user_name||'system', req.params.id]
    );
    
    // Log downgrade activity
    await pool.query(
      `INSERT INTO issue_activity_log (issue_id, activity_type, old_severity, new_severity, reason, severity_at_time, user_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.params.id, 'downgraded', oldSeverity, new_severity, reason, new_severity, user_name||'system']
    );
    
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upgrade severity - reason is mandatory, restart countdown from now
router.put('/:id/upgrade', async (req, res) => {
  const { new_severity, reason, user_name } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is mandatory when upgrading severity' });
  }
  
  try {
    const { rows: issues } = await pool.query('SELECT * FROM issues WHERE id=$1', [req.params.id]);
    if (!issues.length) return res.status(404).json({ error: 'Issue not found' });
    
    const issue = issues[0];
    const currentSeverity = issue.severity;
    const oldSeverity = currentSeverity;
    const allowedUpgrades = currentSeverity === 'Low' ? ['Medium', 'High'] : currentSeverity === 'Medium' ? ['High'] : [];

    if (new_severity === currentSeverity) {
      return res.status(400).json({ error: `Issue is already ${currentSeverity}.` });
    }
    if (!allowedUpgrades.includes(new_severity)) {
      if (allowedUpgrades.length === 0) {
        return res.status(400).json({ error: 'High severity issues cannot be upgraded.' });
      }
      return res.status(400).json({ error: `Can only upgrade ${currentSeverity} issues to: ${allowedUpgrades.join(' or ')}.` });
    }
    
    const deadline = getResolutionDeadline(new_severity);
    
    // Restart countdown from now when upgrading
    const { rows } = await pool.query(
      `UPDATE issues SET severity=$1, status_changed_at=NOW(), resolution_deadline=$2, last_activity_user=$3 WHERE id=$4 RETURNING *`,
      [new_severity, deadline, user_name||'system', req.params.id]
    );
    
    // Log upgrade activity
    await pool.query(
      `INSERT INTO issue_activity_log (issue_id, activity_type, old_severity, new_severity, reason, severity_at_time, user_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.params.id, 'upgraded', oldSeverity, new_severity, reason, new_severity, user_name||'system']
    );
    
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get list of users with login access
router.get('/users/list', async (req, res) => {
  try {
    // Return list of active users who can be assigned issues
    const { rows } = await pool.query(
      'SELECT email, full_name FROM users WHERE status = $1 ORDER BY full_name',
      ['active']
    );
    const users = rows.map(u => ({ email: u.email, name: u.full_name, value: u.email }));
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Assign issue to user
router.put('/:id/assign', async (req, res) => {
  const { assigned_to, user_name, user_email, assignment_note } = req.body;
  if (!assigned_to || !assigned_to.trim()) {
    return res.status(400).json({ error: 'Please select a user to assign to' });
  }
  if (!user_name || !user_name.trim() || !user_email || !user_email.trim()) {
    return res.status(400).json({ error: 'Current user information is required to assign the issue' });
  }

  const requestedAssignee = assigned_to.trim();
  const currentUserName = user_name.trim();
  const currentUserEmail = user_email.trim();
  const noteText = assignment_note && assignment_note.trim() ? assignment_note.trim() : '';

  try {
    const { rows: issues } = await pool.query('SELECT * FROM issues WHERE id=$1', [req.params.id]);
    if (!issues.length) return res.status(404).json({ error: 'Issue not found' });

    const issue = issues[0];
    const currentAssignee = issue.assigned_to ? issue.assigned_to.trim() : '';

    let allowAssign = false;
    let restrictionMessage = '';

    // SIMPLE LOGIC:
    // 1. If issue is unassigned: only self-assign allowed
    // 2. If issue is assigned to you (in your bucket): can assign to anyone else (not yourself)
    // 3. If issue is assigned to someone else (not your bucket): can claim by assigning to yourself, cannot assign to others
    
    if (!currentAssignee) {
      // Unassigned issue: only allow self-assign
      if (requestedAssignee === currentUserEmail) {
        allowAssign = true;
      } else {
        restrictionMessage = 'Unassigned issues can only be assigned to yourself first.';
      }
    } else if (currentAssignee === currentUserEmail) {
      // Issue is in your bucket: can assign to anyone else (but not yourself)
      if (requestedAssignee === currentUserEmail) {
        restrictionMessage = 'Issue is already assigned to you.';
      } else {
        allowAssign = true;
      }
    } else if (requestedAssignee !== currentUserEmail) {
      // Not in your bucket AND trying to assign to someone other than yourself
      restrictionMessage = 'Only the current assignee can assign. You can claim it by assigning to yourself.';
    } else {
      // Issue not in your bucket but trying to claim by assigning to yourself
      allowAssign = true;
    }

    if (!allowAssign) {
      return res.status(403).json({ error: restrictionMessage });
    }

    const { rows } = await pool.query(
      `UPDATE issues SET assigned_to=$1, last_activity_user=$2 WHERE id=$3 RETURNING *`,
      [requestedAssignee, currentUserName, req.params.id]
    );

    // Log assignment activity
    await pool.query(
      `INSERT INTO issue_activity_log (issue_id, activity_type, assigned_to, user_name, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, 'assigned', requestedAssignee, currentUserName, noteText]
    );

    // Send notification to assigned user
    try {
      const userResult = await pool.query(
        'SELECT email, full_name FROM users WHERE email = $1 OR full_name = $1',
        [requestedAssignee]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const now = new Date();
        const deadline = new Date(issue.resolution_deadline || issue.created_at);
        const ms = deadline - now;
        let timeRemaining = 'Breached';
        if (ms > 0) {
          const days = Math.floor(ms / 86400000);
          const hours = Math.floor((ms % 86400000) / 3600000);
          if (days > 0) timeRemaining = `${days}d ${hours}h`;
          else timeRemaining = `${hours}h`;
        }

        const issueDetails = {
          pmno: issue.pmno,
          serial: issue.serial,
          title: issue.title,
          desc: issue.desc,
          severity: issue.severity,
          loc: issue.loc,
          category: issue.category,
          reportedBy: currentUserName,
          assignedBy: currentUserName,
          timeRemaining: timeRemaining,
        };

        await sendIssueAssignmentNotification(user.email, user.full_name, issueDetails);
      }
    } catch (emailError) {
      console.error('Error sending assignment notification:', emailError);
    }

    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM issues WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
