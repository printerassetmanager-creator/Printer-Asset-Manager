const express = require('express');
const cors = require('cors');
const { startPrinterMonitor } = require('./services/printerMonitor');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/printers', require('./routes/printers'));
app.use('/api/vlan', require('./routes/vlan'));
app.use('/api/spare-parts', require('./routes/spareParts'));
app.use('/api/hp-printers', require('./routes/hpPrinters'));
app.use('/api/cartridges', require('./routes/cartridges'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/health-checkup', require('./routes/healthCheckup'));
app.use('/api/pm-pasted', require('./routes/pmPasted'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
startPrinterMonitor();
