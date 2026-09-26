export const validateDonationDates = (availableFrom, expiryTime, responseDeadline = null, preparationTime = null) => {
  const errors = [];
  const now = new Date();
  
  const availDate = new Date(availableFrom);
  const expDate = new Date(expiryTime);
  
  if (availDate < new Date(now.getTime() - 5 * 60 * 1000)) {
    // Allow 5 minutes of wiggle room for "now"
    errors.push('Available time cannot be in the past.');
  }

  if (expDate <= availDate) {
    errors.push('Expiry time must be strictly after the available time.');
  }

  if (preparationTime) {
    const prepDate = new Date(preparationTime);
    if (prepDate > availDate) {
      errors.push('Preparation time must be before or equal to available time.');
    }
  }

  if (responseDeadline) {
    const respDate = new Date(responseDeadline);
    if (respDate < availDate || respDate > expDate) {
      errors.push('Response deadline must be between the available time and expiry time.');
    }
  }

  return errors;
};

export const validateQuantity = (quantity, label = 'Quantity') => {
  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    return `${label} must be a valid positive number greater than zero.`;
  }
  return null;
};
