const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

export function validateEmail(email) {
  const value = normalizeEmail(email);
  if (!value) return 'Email is required';
  if (value.length > 254) return 'Email is too long';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address';
  return '';
}

export function validateLoginPassword(password) {
  if (!password) return 'Password is required';
  if (password.length > 72) return 'Password is too long';
  return '';
}

export function getPasswordChecks(password = '') {
  return {
    length: password.length >= 8 && password.length <= 72,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

export function validatePassword(password) {
  const checks = getPasswordChecks(password);
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password must be at most 72 characters';
  if (!checks.upper) return 'Password must include at least one uppercase letter';
  if (!checks.lower) return 'Password must include at least one lowercase letter';
  if (!checks.number) return 'Password must include at least one number';
  return '';
}

export function validateName(name = '') {
  const value = name.trim();
  if (!value) return 'Name is required';
  if (value.length < 2) return 'Name must be at least 2 characters';
  if (value.length > 80) return 'Name must be at most 80 characters';
  if (!/[\p{L}]/u.test(value)) return 'Name must contain at least one letter';
  return '';
}

export function validateLogin({ email, password }) {
  const errors = {};
  const emailError = validateEmail(email);
  const passwordError = validateLoginPassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { email: normalizeEmail(email), password },
  };
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { name: name.trim(), email: normalizeEmail(email), password },
  };
}

export function applyApiFieldErrors(apiErrors = {}, setFieldErrors) {
  if (!apiErrors || typeof apiErrors !== 'object') return;
  const next = {};
  for (const [key, messages] of Object.entries(apiErrors)) {
    if (Array.isArray(messages) && messages[0]) next[key] = messages[0];
  }
  if (Object.keys(next).length) setFieldErrors((prev) => ({ ...prev, ...next }));
}

export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  return err.response?.data?.message || fallback;
}
