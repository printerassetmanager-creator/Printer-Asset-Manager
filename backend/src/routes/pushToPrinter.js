const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const {
  buildScript,
  checkPrinterStatus,
  ensureRecipeSchema,
  isValidIp,
  normalizeRecipeRow,
  sendTcpScript,
} = require('../services/recipeService');

async function loadRecipe(recipeId) {
  await ensureRecipeSchema(pool);
  const { rows } = await pool.query('SELECT * FROM recipes WHERE id = $1', [recipeId]);
  if (rows.length === 0) return null;
  return normalizeRecipeRow(rows[0]);
}

router.post('/', async (req, res) => {
  const { recipeId, printerIp, action = 'push' } = req.body || {};
  const normalizedAction = String(action || 'push').trim().toLowerCase();

  if (!isValidIp(printerIp)) {
    return res.status(400).json({ error: 'Valid printer IP is required.' });
  }

  if (normalizedAction === 'status') {
    const online = await checkPrinterStatus(printerIp);
    return res.json({
      success: online,
      online,
      message: online ? 'Printer is reachable on port 9100.' : 'Printer is not reachable on port 9100.',
    });
  }

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe selection is required before pushing.' });
  }

  try {
    const recipe = await loadRecipe(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    const script = buildScript(recipe, normalizedAction);
    await sendTcpScript({ ip: printerIp, script });

    return res.json({
      success: true,
      message:
        normalizedAction === 'test-print'
          ? 'Test print sent successfully.'
          : normalizedAction === 'calibrate'
            ? 'Calibration command sent successfully.'
            : 'Script pushed successfully.',
      scriptPreview: script,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Printer not reachable.',
      details: error.message,
    });
  }
});

module.exports = router;
