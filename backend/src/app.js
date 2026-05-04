const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes (mounted in index.js startServer)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/users'));
app.use('/api/printers', require('./routes/printers'));
app.use('/api/spare-parts', require('./routes/spareParts'));
app.use('/api/hp-printers', require('./routes/hpPrinters'));
app.use('/api/cartridges', require('./routes/cartridges'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/push-to-printer', require('./routes/pushToPrinter'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/health-checkup', require('./routes/healthCheckup'));
app.use('/api/pm-pasted', require('./routes/pmPasted'));
app.use('/api/i-learn', require('./routes/iLearn'));
app.use('/api/grammar', require('./routes/grammar'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/application-support', require('./routes/applicationSupport'));

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(503).json({ status: 'Database unavailable', error: error.message });
  }
});

module.exports = app;
