const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ═══ GET CATEGORIES (Must come BEFORE /:id route) ═══
router.get('/categories/list', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT DISTINCT category FROM i_learn_issues ORDER BY category`);
    res.json(rows.map(r => r.category));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ GET ALL ISSUES ═══
router.get('/', async (req, res) => {
  try {
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
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ CREATE ISSUE ═══
router.post('/', async (req, res) => {
  const { title, category, created_by } = req.body;
  try {
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { rows } = await pool.query(
      `INSERT INTO i_learn_issues (title, description, category, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, '', category || 'General', created_by || 'System']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ GET SINGLE ISSUE WITH STEPS ═══
router.get('/:id', async (req, res) => {
  try {
    const issue = await pool.query('SELECT * FROM i_learn_issues WHERE id = $1', [req.params.id]);
    if (issue.rows.length === 0) return res.status(404).json({ error: 'Issue not found' });

    const steps = await pool.query('SELECT * FROM i_learn_steps WHERE issue_id = $1 ORDER BY step_number', [req.params.id]);
    res.json({ ...issue.rows[0], steps: steps.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══ UPDATE ISSUE ═══
router.put('/:id', async (req, res) => {
  const { title, category } = req.body;
  try {
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
router.delete('/:id', async (req, res) => {
  try {
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
router.put('/:id/steps/:stepId', async (req, res) => {
  const { title, description, image_url, step_number } = req.body;
  try {
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
router.delete('/:id/steps/:stepId', async (req, res) => {
  try {
    await pool.query('DELETE FROM i_learn_steps WHERE id = $1', [req.params.stepId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
