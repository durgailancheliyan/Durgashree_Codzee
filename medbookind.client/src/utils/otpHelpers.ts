export function applyOtpToDigits(otp: string): string[] {
  const digits = otp.replace(/\D/g, '').slice(0, 6).split('');
  while (digits.length < 6) digits.push('');
  return digits;
}
