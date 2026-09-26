/**
 * Validates password based on criteria:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@, #, !, $, %)
 * - Minimum 8 characters
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#!$%])[A-Za-z\d@#!$%]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validates mobile phone number:
 * - Exactly 10 digits
 * - Numbers only
 */
const validatePhone = (phone) => {
  if (!phone) return false;
  const phoneStr = String(phone).trim();
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phoneStr);
};

module.exports = {
  validatePassword,
  validatePhone
};
