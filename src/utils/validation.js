// Form validation helpers

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return null;
};

export const validateRequired = (field, name) => {
  if (!field || (typeof field === 'string' && field.trim() === '')) {
    return `${name} is required`;
  }
  return null;
};

export const validateNumber = (value, name, min = 0, max = Infinity) => {
  if (value === undefined || value === null || value === '') {
    return `${name} is required`;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return `${name} must be a number`;
  }
  if (num < min || num > max) {
    return `${name} must be between ${min} and ${max}`;
  }
  return null;
};
