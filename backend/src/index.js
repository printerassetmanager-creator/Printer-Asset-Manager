const express = require('express');
const cors = require('cors');
const { startPrinterMonitor } = require('./services/printerMonitor');
const { startHPPrinterMonitor } = require('./services/hpPrinterMonitor');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/users'));

// Routes
app.use('/api/printers', require('./routes/printers'));
app.use('/api/vlan', require('./routes/vlan'));
app.use('/api/spare-parts', require('./routes/spareParts'));
app.use('/api/hp-printers', require('./routes/hpPrinters'));
app.use('/api/cartridges', require('./routes/cartridges'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/push-to-printer', require('./routes/pushToPrinter'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/health-checkup', require('./routes/healthCheckup'));
app.use('/api/pm-pasted', require('./routes/pmPasted'));
app.use('/api/i-learn', require('./routes/iLearn'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
startPrinterMonitor();
startHPPrinterMonitor();
