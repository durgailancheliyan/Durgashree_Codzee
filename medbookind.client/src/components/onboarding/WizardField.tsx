import React from 'react';

type WizardFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

/** Labeled form field with required marker, hint, and inline error for onboarding. */
const WizardField: React.FC<WizardFieldProps> = ({
  id,
  label,
  required,
  hint,
  error,
  children,
  className = '',
}) => {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="text-rose-500 ml-0.5" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>
        )}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-slate-500 leading-relaxed">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default WizardField;
