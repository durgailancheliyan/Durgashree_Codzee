import React from 'react';

interface OtpInputProps {
  digits: string[];
  onChange: (index: number, value: string) => void;
  idPrefix?: string;
}

const OtpInput: React.FC<OtpInputProps> = ({ digits, onChange, idPrefix = 'otp' }) => {
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    onChange(index, value.slice(-1));
    if (value && index < 5) {
      const next = document.getElementById(`${idPrefix}-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          id={`${idPrefix}-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-10 h-12 text-center text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
        />
      ))}
    </div>
  );
};

export default OtpInput;

export function otpFromDigits(digits: string[]): string {
  return digits.join('');
}

export const EMPTY_OTP = ['', '', '', '', '', ''];
