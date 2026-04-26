/**
 * Convert text to Sentence Case (first letter uppercase, rest lowercase)
 * @param {string} text - The text to convert
 * @returns {string} - Text in sentence case
 */
export const toSentenceCase = (text) => {
  if (!text) return '';
  return String(text)
    .trim()
    .charAt(0)
    .toUpperCase() + String(text).trim().slice(1).toLowerCase();
};

/**
 * Apply sentence case to specific object properties
 * @param {object} obj - The object to transform
 * @param {array} fields - Array of field names to apply sentence case to
 * @returns {object} - New object with transformed fields
 */
export const applySentenceCaseToFields = (obj, fields = []) => {
  if (!obj) return obj;
  const transformed = { ...obj };
  fields.forEach(field => {
    if (transformed[field] && typeof transformed[field] === 'string') {
      transformed[field] = toSentenceCase(transformed[field]);
    }
  });
  return transformed;
};

const COMMON_REPLACEMENTS = [
  [/\bdont\b/gi, "don't"],
  [/\bcant\b/gi, "can't"],
  [/\bwont\b/gi, "won't"],
  [/\bdoesnt\b/gi, "doesn't"],
  [/\bdidnt\b/gi, "didn't"],
  [/\bisnt\b/gi, "isn't"],
  [/\barent\b/gi, "aren't"],
  [/\bim\b/gi, "I'm"],
  [/\biam\b/gi, 'I am'],
  [/\bplz\b/gi, 'please'],
  [/\bu\b/gi, 'you'],
  [/\bur\b/gi, 'your'],
  [/\bthier\b/gi, 'their'],
  [/\bteh\b/gi, 'the'],
  [/\brecieve\b/gi, 'receive'],
  [/\bseperate\b/gi, 'separate'],
  [/\bgramatically\b/gi, 'grammatically'],
  [/\bsuggession\b/gi, 'suggestion'],
  [/\bstapes\b/gi, 'steps'],
  [/\bmsg\b/gi, 'message'],
];

const normalizeSpacing = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])([^\s])/g, '$1 $2')
    .trim();

const capitalizeSentences = (text) =>
  text.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);

const capitalizeStandaloneI = (text) => text.replace(/\bi\b/g, 'I');

const normalizeInstructionPhrases = (text) =>
  text
    .replace(/\bclick on\b/gi, 'click')
    .replace(/\bcheck and verify\b/gi, 'check')
    .replace(/\bpls\b/gi, 'please')
    .replace(/\blog in\b/gi, 'log in')
    .replace(/\bsetup\b/gi, 'set up')
    .replace(/\bcross check\b/gi, 'cross-check');

const fixRepeatedWords = (text) => text.replace(/\b(\w+)\s+\1\b/gi, '$1');

const normalizeTechnicalTerms = (text) =>
  text
    .replace(/\bip\b/g, 'IP')
    .replace(/\bsap\b/g, 'SAP')
    .replace(/\bmes\b/g, 'MES')
    .replace(/\bloftware\b/gi, 'Loftware');

const improveInstructionGrammar = (text) => {
  let improved = text;

  improved = improved
    .replace(/^first\s+cross-check\s+/i, 'First, cross-check ')
    .replace(/^first\s+check\s+/i, 'First, check ')
    .replace(/\bcross-check\s+ip\b/gi, 'cross-check that the IP')
    .replace(/\bip\s+show\s+on\s+printer\b/gi, 'IP shown on the printer')
    .replace(/\bip\s+shown\s+on\s+printer\b/gi, 'IP shown on the printer')
    .replace(/\bshown\s+on\s+printer\b/gi, 'shown on the printer')
    .replace(/\bshow\s+on\s+printer\b/gi, 'shown on the printer')
    .replace(/\bis\s+show\b/gi, 'is shown')
    .replace(/\bis\s+shown\s+in\s+particular\s+loftware\b/gi, 'is shown in Loftware')
    .replace(/\bis\s+show\s+in\s+particular\s+loftware\b/gi, 'is shown in Loftware')
    .replace(/\bshow\s+in\s+particular\s+loftware\b/gi, 'shown in Loftware')
    .replace(/\bshown\s+in\s+particular\s+loftware\b/gi, 'shown in Loftware')
    .replace(/\bin\s+particular\s+loftware\b/gi, 'in Loftware')
    .replace(/\bparticular\s+loftware\b/gi, 'Loftware')
    .replace(/\bprinter\s+is\s+shown\b/gi, 'printer is shown')
    .replace(/\bthat\s+the\s+IP\s+shown\s+on\s+the\s+printer\s+is\s+shown\b/gi, 'that the IP shown on the printer is also shown')
    .replace(/\bthat\s+the\s+IP\s+shown\s+on\s+the\s+printer\s+shown\b/gi, 'that the IP shown on the printer is also shown');

  return improved;
};

const formatTitleText = (text) => {
  const cleaned = normalizeTechnicalTerms(
    capitalizeStandaloneI(normalizeInstructionPhrases(normalizeSpacing(text)))
  )
    .replace(/[.!?]+$/g, '');

  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatSentenceText = (text) => {
  let cleaned = normalizeSpacing(text);

  COMMON_REPLACEMENTS.forEach(([pattern, replacement]) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  cleaned = normalizeInstructionPhrases(cleaned);
  cleaned = normalizeTechnicalTerms(cleaned);
  cleaned = improveInstructionGrammar(cleaned);
  cleaned = capitalizeStandaloneI(cleaned);
  cleaned = fixRepeatedWords(cleaned);
  cleaned = capitalizeSentences(cleaned);

  if (!cleaned) return '';
  if (!/[.!?]$/.test(cleaned)) cleaned += '.';
  return cleaned;
};

export const improveWriting = (text, mode = 'sentence') => {
  if (!text) return '';
  return mode === 'title' ? formatTitleText(text) : formatSentenceText(text);
};

export const getWritingSuggestion = (text, mode = 'sentence') => {
  const original = String(text || '').trim();
  if (!original) return '';

  const improved = improveWriting(original, mode);
  return improved !== original ? improved : '';
};
// Spellings/casing/punctuation handled by getWritingSuggestion and helpers above.
