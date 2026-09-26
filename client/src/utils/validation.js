/**
 * Validates password:
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (@, #, !, $, %)
 * - Minimum 8 characters
 */
export const validatePassword = (password) => {
  if (!password) return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#!$%])[A-Za-z\d@#!$%]{8,}$/;
  return regex.test(password);
};

/**
 * Validates mobile number:
 * - Exactly 10 digits
 * - Numbers only
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  const str = String(phone).trim();
  return /^\d{10}$/.test(str);
};
