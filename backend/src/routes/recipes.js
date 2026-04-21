const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { adminMiddleware } = require('../middleware/auth');
const {
  buildSummaryFields,
  ensureRecipeSchema,
  normalizeRecipeRow,
  validateRecipePayload,
} = require('../services/recipeService');

router.get('/', async (req, res) => {
  try {
    await ensureRecipeSchema(pool);
    const { rows } = await pool.query('SELECT * FROM recipes ORDER BY updated_at DESC, name ASC');
    res.json(rows.map(normalizeRecipeRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { errors, recipe } = validateRecipePayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const summary = buildSummaryFields(recipe);

  try {
    await ensureRecipeSchema(pool);
    const { rows } = await pool.query(
      `INSERT INTO recipes (
        name, make, model, dpi, media, width, length, top, left_margin, darkness, speed,
        calibration, size, "desc", config_json
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15::jsonb
      ) RETURNING *`,
      [
        recipe.name,
        recipe.brand,
        recipe.model,
        recipe.dpi,
        summary.media,
        summary.width,
        summary.length,
        summary.top,
        summary.leftMargin,
        summary.darkness,
        summary.speed,
        summary.calibration,
        summary.size,
        recipe.notes,
        JSON.stringify(recipe.config),
      ]
    );

    return res.status(201).json(normalizeRecipeRow(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { errors, recipe } = validateRecipePayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const summary = buildSummaryFields(recipe);

  try {
    await ensureRecipeSchema(pool);
    const { rows } = await pool.query(
      `UPDATE recipes
       SET name = $1,
           make = $2,
           model = $3,
           dpi = $4,
           media = $5,
           width = $6,
           length = $7,
           top = $8,
           left_margin = $9,
           darkness = $10,
           speed = $11,
           calibration = $12,
           size = $13,
           "desc" = $14,
           config_json = $15::jsonb,
           updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        recipe.name,
        recipe.brand,
        recipe.model,
        recipe.dpi,
        summary.media,
        summary.width,
        summary.length,
        summary.top,
        summary.leftMargin,
        summary.darkness,
        summary.speed,
        summary.calibration,
        summary.size,
        recipe.notes,
        JSON.stringify(recipe.config),
        req.params.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    return res.json(normalizeRecipeRow(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await ensureRecipeSchema(pool);
    const result = await pool.query('DELETE FROM recipes WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
