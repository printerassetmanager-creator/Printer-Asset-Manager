# Issue Unique ID System - Implementation Guide

## Overview
Every issue now has a unique identifier starting with **ISU** followed by a 6-digit number (e.g., **ISU000001**, **ISU000002**, etc.). This allows users to search and reference issues easily.

## What's Been Implemented

### 1. **Database Changes**
- Added `issue_unique_id` column to the `issues` table in `schema.sql`
- Created database index on `issue_unique_id` for fast searching
- Migration file created: `backend/migrations/add_issue_unique_id.sql`

### 2. **Backend Changes** (`backend/src/routes/issues.js`)
- Updated POST route to automatically generate unique IDs when creating new issues
- Format: `ISU` + padded ID (e.g., ISU000001, ISU000002, ISU000123)
- All issue responses now include the `issue_unique_id` field

### 3. **Frontend Changes** (`frontend/src/pages/IssuesTracker.jsx`)
- **Search Filter**: Updated to search by Issue ID, PM No, serial, model, and description
- **Search Placeholder**: Updated to mention "Issue ID (ISU001)" format
- **Issue Display**: Issue ID now displays prominently in blue at the beginning of each issue title
- **Fuzzy Search**: Issue unique ID included in searchable fields

## How to Use

### Running the Migration
To apply these changes to your database:

```bash
cd backend
psql -U your_user -d your_db -f migrations/add_issue_unique_id.sql
```

Or if using your custom migration runner:
```bash
node runMigration.js
```

### Searching by Issue ID
1. Go to **Issues Tracker** page
2. In the search box, type:
   - `ISU000001` - Search by issue ID
   - `ISU0001` - Partial match also works
   - Mixed search still works (PM No, serial, etc.)

### Viewing Issue ID
- Each issue card now displays the ID in **blue** at the top: `[ISU000001] Issue Title`
- Click on an issue to view full details including the ID

## Example
```
[ISU000001] Printer Jam in Bay A1
  📋 1256 🔧 SN12345 🖨 HP LaserJet 📍 B26-A1-01 📁 Hardware
```

## Database Queries

### View all issues with their IDs
```sql
SELECT issue_unique_id, title, status, severity FROM issues ORDER BY id DESC;
```

### Search issue by ID
```sql
SELECT * FROM issues WHERE issue_unique_id = 'ISU000001';
```

### Check if migration applied
```sql
SELECT COUNT(*) FROM issues WHERE issue_unique_id IS NOT NULL;
```

## Notes
- Existing issues will get IDs based on their internal database ID
- New issues created will automatically get sequential IDs
- The unique ID is permanent and cannot be changed
- Search is case-insensitive for flexibility
