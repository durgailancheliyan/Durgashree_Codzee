import React from 'react';
import { getPasswordStrength, getPasswordStrengthLabel } from '@/utils/passwordStrength';

interface PasswordStrengthBarProps {
  password: string;
}

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password }) => {
  if (!password) return null;
  const score = getPasswordStrength(password);
  const label = getPasswordStrengthLabel(score);

  return (
    <div className="space-y-1">
      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className={`h-2 rounded transition-all duration-300 ${
            score === 1
              ? 'bg-red-500 w-1/4'
              : score === 2
              ? 'bg-yellow-500 w-2/4'
              : score === 3
              ? 'bg-blue-500 w-3/4'
              : score === 4
              ? 'bg-green-500 w-full'
              : 'w-0'
          }`}
        />
      </div>
      <p className="text-xs text-gray-500">
        Strength: <span className="font-medium text-gray-700">{label}</span>
        {score < 3 && ' — use 8+ chars, upper, number, symbol'}
      </p>
    </div>
  );
};

export default PasswordStrengthBar;
