export const LOFTWARE_OPTIONS = [
  'INRJNM0LOFT01',
  'INRJNM0LOFT02',
  'INRJNM0LOFT03',
  'INRJNM0LOFT05',
];

function normalizeLoftwareOption(value) {
  const cleaned = String(value || '').trim().toUpperCase();
  if (!cleaned) return '';

  const compact = cleaned.replace(/[^A-Z0-9]/g, '');
  const aliases = {
    INRJNM0LOFT1: 'INRJNM0LOFT01',
    INRJNM0LOFT01: 'INRJNM0LOFT01',
    INRJNM0LOFT2: 'INRJNM0LOFT02',
    INRJNM0LOFT02: 'INRJNM0LOFT02',
    INRJNM0LOFT3: 'INRJNM0LOFT03',
    INRJNM0LOFT03: 'INRJNM0LOFT03',
    INRJNM0LOFT5: 'INRJNM0LOFT05',
    INRJNM0LOFT05: 'INRJNM0LOFT05',
  };

  return aliases[compact] || cleaned;
}

export function parseLoftwareValue(value) {
  const parts = String(value || '')
    .split(',')
    .map((part) => normalizeLoftwareOption(part))
    .filter(Boolean);

  return {
    primary: parts[0] || '',
    secondary: parts[1] || '',
  };
}

export function buildLoftwareValue(primary, secondary) {
  return [primary, secondary]
    .map((value) => normalizeLoftwareOption(value))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(', ');
}

export function getDefaultLoftwareForSap(sapno) {
  return sapno ? LOFTWARE_OPTIONS[0] : '';
}
