const UPI_PATTERN = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9._-]{2,}$/;

export function normalizePhone(phone = '') {
  return phone.replace(/\s+/g, '').replace(/^\+91/, '');
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

export function isValidUpi(vpa = '') {
  return UPI_PATTERN.test(vpa.trim());
}

export function isValidCardNumber(number = '') {
  const digits = number.replace(/\s+/g, '');
  return /^\d{16}$/.test(digits);
}

export function isValidCardExpiry(expiry = '') {
  const value = expiry.trim();
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return false;
  const [month, year] = value.split('/').map(Number);
  const now = new Date();
  const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59);
  return expiryDate >= now;
}

export function isValidCvv(cvv = '') {
  return /^\d{3,4}$/.test(cvv.trim());
}

export function getPaymentMethodLabel(subMethod, bankCode, banks = []) {
  if (subMethod === 'upi') return 'UPI';
  if (subMethod === 'netbanking') {
    const bank = banks.find((b) => b.code === bankCode);
    return bank ? `Net Banking · ${bank.label}` : 'Net Banking';
  }
  return 'Debit / Credit Card';
}

export function validateCheckout({ billing, subMethod, upiVpa, bankCode, card }) {
  const errors = [];

  if (!billing.name?.trim()) errors.push('Enter your full name in billing details.');
  if (!isValidPhone(billing.phone)) errors.push('Enter a valid 10-digit Indian mobile number.');
  if (!billing.address?.trim()) errors.push('Enter your billing address.');

  if (subMethod === 'upi') {
    if (!isValidUpi(upiVpa)) errors.push('Enter a valid UPI ID (example: yourname@oksbi).');
  } else if (subMethod === 'netbanking') {
    if (!bankCode) errors.push('Select your bank for net banking.');
  } else if (subMethod === 'card') {
    if (!card.name?.trim()) errors.push('Enter the name printed on your card.');
    if (!isValidCardNumber(card.number)) errors.push('Enter a valid 16-digit card number.');
    if (!isValidCardExpiry(card.expiry)) errors.push('Enter a valid card expiry in MM/YY format.');
    if (!isValidCvv(card.cvv)) errors.push('Enter a valid 3 or 4 digit CVV.');
  }

  return errors;
}
