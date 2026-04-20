# Simple Issue Assignment Logic

## Rules

### 1. **Unassigned Issue** (Not assigned to anyone)
- ✅ **You can**: Assign it to **yourself only**
- ❌ **You cannot**: Assign it directly to someone else
- 💡 **Action**: Click "Assign & Notify" and select yourself, then reassign to others

### 2. **Issue in Your Bucket** (Assigned to you)
- ✅ **You can**: Assign it to **anyone** (including other users)
- ❌ **You cannot**: Assign it back to yourself (already yours)
- 💡 **Action**: Click "Assign & Notify" and select the target user

### 3. **Issue NOT in Your Bucket** (Assigned to someone else)
- ❌ **You cannot**: Assign it to anyone else
- ✅ **You can**: Claim it first by assigning to **yourself**
- 💡 **Action**: Click "Assign & Notify", select yourself, then later reassign to others

## Examples

### Scenario 1: Unassigned Issue
```
Issue: [ISU000001] Printer Jam
Status: Unassigned

Action:
1. Click "Assign & Notify"
2. Select "yourself" → Assign
3. Now issue is in your bucket
4. Click "Assign & Notify" again
5. Select another user → Assign
```

### Scenario 2: Issue Assigned to You
```
Issue: [ISU000002] Cartridge Empty
Status: Assigned to YOU

Action:
1. Click "Assign & Notify"
2. Select target user (e.g., John, Sarah)
3. Assign → Done!
```

### Scenario 3: Issue Assigned to Someone Else
```
Issue: [ISU000003] Network Error
Status: Assigned to John

Action (If You Want It):
1. Click "Assign & Notify"
2. Select "yourself" → Assign
3. Issue moves to your bucket
4. Later reassign to others as needed
```

---

## Key Points

| Situation | Can Assign? | To Whom? |
|-----------|-------------|---------|
| **Unassigned** | Yes | Only yourself |
| **In Your Bucket** | Yes | Anyone (not yourself) |
| **Someone Else's** | Yes | Only yourself (to claim it) |

**Error Messages:**
- _"Unassigned issues can only be assigned to yourself first."_
- _"Only the current assignee can assign this issue. Claim it first by assigning to yourself."_
- _"Issue is already assigned to that user."_

---

## Implementation Details

**Backend Route**: `/api/issues/:id/assign` (PUT)
- Validates assignment rules before updating
- Logs all assignment changes
- Sends notification emails to assigned users

**Frontend Validation**: Real-time checks before API call
- Prevents invalid requests
- Shows clear error messages
- Better user experience

**Database**: issue_activity_log tracks all assignments
- Who assigned
- To whom
- When

---

## Workflow Example

```
User: YOU
Issue: [ISU000050] Print Head Misaligned

Timeline:
1. Issue created → Unassigned
2. You: "Assign to myself" → Assigned to YOU
3. You: "Assign to Sarah" → Assigned to SARAH
4. Sarah: "Assign to Mike" → Assigned to MIKE
5. Mike: "Assign to myself" → Assigned to MIKE (already assigned)
6. You: Cannot directly reassign (not your bucket)
```

This simple logic ensures clear ownership and prevents confusion about who can manage issues.
