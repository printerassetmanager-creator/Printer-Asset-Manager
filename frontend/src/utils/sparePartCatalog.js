const PART_CATALOG_BASE = [
  { prefix: 'PWR', name: 'SMPS', category: 'Power' },
  { prefix: 'PWR', name: 'Power Supply Unit', category: 'Power' },
  { prefix: 'PWR', name: 'Power Board', category: 'Power' },
  { prefix: 'PWR', name: 'Power Entry Module', category: 'Power' },
  { prefix: 'PWR', name: 'AC Socket', category: 'Power' },
  { prefix: 'PWR', name: 'Fuse', category: 'Power' },
  { prefix: 'PWR', name: 'Power Cable', category: 'Power' },
  { prefix: 'PCB', name: 'Main Logic Board', category: 'PCB' },
  { prefix: 'PCB', name: 'CPU Board', category: 'PCB' },
  { prefix: 'PCB', name: 'Control Panel PCB', category: 'PCB' },
  { prefix: 'PCB', name: 'Interface Board', category: 'PCB' },
  { prefix: 'NET', name: 'LAN Module', category: 'Communication' },
  { prefix: 'NET', name: 'Bluetooth Module', category: 'Communication' },
  { prefix: 'NET', name: 'USB Port Module', category: 'Communication' },
  { prefix: 'PH', name: 'Printhead Cable', category: 'Printhead' },
  { prefix: 'PH', name: 'Printhead Assembly', category: 'Printhead' },
  { prefix: 'PH', name: 'Printhead Carriage', category: 'Printhead' },
  { prefix: 'PH', name: 'Printhead Spring', category: 'Printhead' },
  { prefix: 'MECH', name: 'Print Mechanism Assembly', category: 'Mechanism' },
  { prefix: 'MTR', name: 'Stepper Motor', category: 'Motor' },
  { prefix: 'MTR', name: 'Main Motor', category: 'Motor' },
  { prefix: 'MTR', name: 'Ribbon Motor', category: 'Motor' },
  { prefix: 'MTR', name: 'Drive Motor', category: 'Motor' },
  { prefix: 'MTR', name: 'Motor Assembly', category: 'Motor' },
  { prefix: 'DRV', name: 'Timing Belt', category: 'Drive' },
  { prefix: 'DRV', name: 'Drive Belt', category: 'Drive' },
  { prefix: 'DRV', name: 'Pulley', category: 'Drive' },
  { prefix: 'DRV', name: 'Gear Set', category: 'Drive' },
  { prefix: 'DRV', name: 'Shaft', category: 'Drive' },
  { prefix: 'MED', name: 'Platen Roller', category: 'Media Path' },
  { prefix: 'MED', name: 'Platen Bearings', category: 'Media Path' },
  { prefix: 'MED', name: 'Media Guide', category: 'Media Path' },
  { prefix: 'MED', name: 'Media Holder', category: 'Media Path' },
  { prefix: 'RBN', name: 'Ribbon Core Holder', category: 'Ribbon' },
  { prefix: 'SNS', name: 'Gap Sensor', category: 'Sensor' },
  { prefix: 'SNS', name: 'Black Mark Sensor', category: 'Sensor' },
  { prefix: 'SNS', name: 'Ribbon Sensor', category: 'Sensor' },
  { prefix: 'SNS', name: 'Label Taken Sensor', category: 'Sensor' },
  { prefix: 'SNS', name: 'Head Open Sensor', category: 'Sensor' },
  { prefix: 'SNS', name: 'Media Sensor', category: 'Sensor' },
  { prefix: 'CUT', name: 'Cutter Assembly', category: 'Cutter' },
  { prefix: 'CUT', name: 'Cutter Blade', category: 'Cutter' },
  { prefix: 'CUT', name: 'Partial Cutter', category: 'Cutter' },
  { prefix: 'CUT', name: 'Full Cutter', category: 'Cutter' },
  { prefix: 'CUT', name: 'Peeler Module', category: 'Cutter' },
  { prefix: 'CBL', name: 'Flat Cable (FFC)', category: 'Cable' },
  { prefix: 'CBL', name: 'Ribbon Cable', category: 'Cable' },
  { prefix: 'CBL', name: 'Connector', category: 'Cable' },
  { prefix: 'CBL', name: 'Wiring Harness', category: 'Cable' },
  { prefix: 'HW', name: 'Spring', category: 'Hardware' },
  { prefix: 'HW', name: 'Screw Kit', category: 'Hardware' },
  { prefix: 'ENC', name: 'Cover Assembly', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Top Cover', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Front Bezel', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Back Panel', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Side Panel', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Hinges', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Frame', category: 'Enclosure' },
  { prefix: 'ENC', name: 'Media Window', category: 'Enclosure' },
  { prefix: 'UI', name: 'LCD Display', category: 'User Interface' },
  { prefix: 'UI', name: 'Touchscreen Display', category: 'User Interface' },
  { prefix: 'UI', name: 'Touchpad', category: 'User Interface' },
  { prefix: 'UI', name: 'Keypad', category: 'User Interface' },
  { prefix: 'UI', name: 'Control Panel', category: 'User Interface' },
  { prefix: 'UI', name: 'Button Assembly', category: 'User Interface' },
  { prefix: 'UI', name: 'Push Buttons', category: 'User Interface' },
  { prefix: 'UI', name: 'Feed Button', category: 'User Interface' },
  { prefix: 'UI', name: 'Reset Button', category: 'User Interface' },
  { prefix: 'UI', name: 'Navigation Buttons', category: 'User Interface' },
  { prefix: 'UI', name: 'Indicator LEDs', category: 'User Interface' },
  { prefix: 'ACC', name: 'Label Holder', category: 'Accessory' },
  { prefix: 'ACC', name: 'Ribbon Spindle', category: 'Accessory' },
  { prefix: 'VIS', name: 'Verifier Camera', category: 'Vision' },
  { prefix: 'VIS', name: 'Vision Module', category: 'Vision' },
  { prefix: 'VIS', name: 'Calibration Sensor', category: 'Vision' },
  { prefix: 'VIS', name: 'Inspection System', category: 'Vision' }
];

export const PART_CATALOG = PART_CATALOG_BASE.map((part, index) => ({
  ...part,
  code: `${part.prefix}-${String(index + 1).padStart(3, '0')}`
}));

export const findCatalogPart = (value) => {
  const query = String(value || '').trim().toLowerCase();
  if (!query) return undefined;
  return PART_CATALOG.find((part) => part.code.toLowerCase() === query || part.name.toLowerCase() === query);
};

export const getCatalogMatches = (value, limit = 14) => {
  const query = String(value || '').trim().toLowerCase();
  const source = query
    ? PART_CATALOG.filter((part) => `${part.name} ${part.code} ${part.category}`.toLowerCase().includes(query))
    : PART_CATALOG;
  return source.slice(0, limit);
};
