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
