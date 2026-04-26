const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { adminMiddleware } = require('../middleware/auth');

let ensureSchemaPromise = null;

async function ensureILearnSchema() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS i_learn_issues (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'General',
          keywords TEXT,
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS i_learn_steps (
          id SERIAL PRIMARY KEY,
          issue_id INTEGER NOT NULL REFERENCES i_learn_issues(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`ALTER TABLE i_learn_issues ADD COLUMN IF NOT EXISTS description TEXT`);
      await pool.query(`ALTER TABLE i_learn_issues ADD COLUMN IF NOT EXISTS keywords TEXT`);
      await pool.query(`ALTER TABLE i_learn_issues ADD COLUMN IF NOT EXISTS created_by VARCHAR(100)`);
      await pool.query(`ALTER TABLE i_learn_issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
      await pool.query(`ALTER TABLE i_learn_steps ADD COLUMN IF NOT EXISTS description TEXT`);
      await pool.query(`ALTER TABLE i_learn_steps ADD COLUMN IF NOT EXISTS image_url TEXT`);
      await pool.query(`ALTER TABLE i_learn_steps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_i_learn_issues_category ON i_learn_issues(category)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_i_learn_issues_created_at ON i_learn_issues(created_at DESC)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_i_learn_steps_issue_id ON i_learn_steps(issue_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_i_learn_steps_step_number ON i_learn_steps(step_number)`);
    })().catch((error) => {
      ensureSchemaPromise = null;
      throw error;
    });
  }

  return ensureSchemaPromise;
}

// ═══ GET CATEGORIES (Must come BEFORE /:id route) ═══
router.get('/categories/list', async (req, res) => {
  try {
    await ensureILearnSchema();
    const { rows } = await pool.query(`SELECT DISTINCT category FROM i_learn_issues ORDER BY category`);
    res.json(rows.map(r => r.category));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ GET ALL ISSUES ═══
router.get('/', async (req, res) => {
  try {
    await ensureILearnSchema();
    const { category, search } = req.query;
    let query = 'SELECT * FROM i_learn_issues WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }

    if (search) {
      query += ' AND title ILIKE $' + (params.length + 1);
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    const issuesWithSteps = await Promise.all(
      rows.map(async (issue) => {
        const steps = await pool.query(
          'SELECT * FROM i_learn_steps WHERE issue_id = $1 ORDER BY step_number',
          [issue.id]
        );
        return { ...issue, steps: steps.rows };
      })
    );
    res.json(issuesWithSteps);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ CREATE ISSUE ═══
router.post('/', async (req, res) => {
  const { title, category, created_by, steps = [] } = req.body;
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await ensureILearnSchema();
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'At least one step is required' });
    }

    await client.query('BEGIN');
    transactionStarted = true;

    const { rows } = await client.query(
      `INSERT INTO i_learn_issues (title, description, category, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, '', category || 'General', created_by || 'System']
    );

    const issue = rows[0];
    const savedSteps = [];

    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index] || {};
      if (!step.title) {
        throw new Error(`Step ${index + 1} title is required`);
      }

      const { rows: insertedSteps } = await client.query(
        `INSERT INTO i_learn_steps (issue_id, step_number, title, description, image_url)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          issue.id,
          step.step_number || index + 1,
          step.title,
          step.description || '',
          step.image_url || null,
        ]
      );
      savedSteps.push(insertedSteps[0]);
    }

    await client.query('COMMIT');
    transactionStarted = false;
    res.status(201).json({ ...issue, steps: savedSteps });
  } catch (e) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ═══ GET SINGLE ISSUE WITH STEPS ═══
router.get('/:id', async (req, res) => {
  try {
    await ensureILearnSchema();
    const issue = await pool.query('SELECT * FROM i_learn_issues WHERE id = $1', [req.params.id]);
    if (issue.rows.length === 0) return res.status(404).json({ error: 'Issue not found' });

    const steps = await pool.query('SELECT * FROM i_learn_steps WHERE issue_id = $1 ORDER BY step_number', [req.params.id]);
    res.json({ ...issue.rows[0], steps: steps.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ UPDATE ISSUE ═══
router.put('/:id', adminMiddleware, async (req, res) => {
  const { title, category } = req.body;
  try {
    await ensureILearnSchema();
    const { rows } = await pool.query(
      `UPDATE i_learn_issues 
       SET title = $1, category = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [title, category, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ DELETE ISSUE ═══
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await ensureILearnSchema();
    await pool.query('DELETE FROM i_learn_issues WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ ADD STEP ═══
router.post('/:id/steps', async (req, res) => {
  const { title, description, image_url, step_number } = req.body;
  try {
    await ensureILearnSchema();
    if (!title) return res.status(400).json({ error: 'Step title is required' });

    const { rows } = await pool.query(
      `INSERT INTO i_learn_steps (issue_id, step_number, title, description, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, step_number || 1, title, description || '', image_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ UPDATE STEP ═══
router.put('/:id/steps/:stepId', adminMiddleware, async (req, res) => {
  const { title, description, image_url, step_number } = req.body;
  try {
    await ensureILearnSchema();
    const { rows } = await pool.query(
      `UPDATE i_learn_steps 
       SET title = $1, description = $2, image_url = $3, step_number = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, image_url || null, step_number, req.params.stepId]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ DELETE STEP ═══
router.delete('/:id/steps/:stepId', adminMiddleware, async (req, res) => {
  try {
    await ensureILearnSchema();
    await pool.query('DELETE FROM i_learn_steps WHERE id = $1', [req.params.stepId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
