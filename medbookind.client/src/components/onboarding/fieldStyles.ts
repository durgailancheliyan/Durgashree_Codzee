/** Shared input/select/textarea classes for onboarding wizard fields. */
export function fieldControlClass(hasError?: boolean): string {
  return [
    'block w-full px-3.5 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900',
    'rounded-xl border bg-white shadow-sm',
    'placeholder:text-slate-400',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    hasError
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
      : 'border-slate-200 hover:border-teal-300 focus:border-teal-500 focus:ring-teal-200',
  ].join(' ');
}
