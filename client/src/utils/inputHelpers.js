/**
 * Utility functions for digit-only and fixed-length input fields.
 */

/**
 * Strips non-digit characters from input value and truncates to maxLength.
 * @param {string} value - Raw input value
 * @param {number} [maxLength] - Optional maximum length
 * @returns {string} Digits-only string capped at maxLength
 */
export const sanitizeDigitInput = (value, maxLength) => {
  if (value === null || value === undefined) return '';
  const digitsOnly = String(value).replace(/\D/g, '');
  return maxLength ? digitsOnly.slice(0, maxLength) : digitsOnly;
};

/**
 * Wraps an onChange event handler to enforce digit-only input up to maxLength.
 * @param {Function} onChange - Original onChange callback
 * @param {number} maxLength - Maximum digit length
 * @returns {Function} Event handler function
 */
export const handleDigitInput = (onChange, maxLength) => (e) => {
  const sanitized = sanitizeDigitInput(e.target.value, maxLength);
  const syntheticEvent = {
    ...e,
    target: {
      ...e.target,
      name: e.target.name,
      value: sanitized,
    },
  };
  onChange(syntheticEvent);
};
