const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/', async (req, res) => {
  const { text, language = 'en-US' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', language);

    const resp = await fetch('https://languagetool.org/api/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await resp.json();
    // Return only matches to keep response small
    res.json({ matches: data.matches || [] });
  } catch (e) {
    console.error('Grammar proxy error', e);
    res.status(500).json({ error: 'Grammar service unavailable' });
  }
});

module.exports = router;
