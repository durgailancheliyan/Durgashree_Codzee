import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

type BannerTone = 'success' | 'error' | 'info' | 'loading';

type StatusBannerProps = {
  tone: BannerTone;
  message: string;
  onDismiss?: () => void;
};

const styles: Record<BannerTone, string> = {
  success: 'bg-teal-50 border-teal-200 text-teal-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  loading: 'bg-slate-50 border-slate-200 text-slate-800',
};

const StatusBanner: React.FC<StatusBannerProps> = ({ tone, message, onDismiss }) => {
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'loading'
        ? Loader2
        : AlertCircle;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles[tone]}`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 mt-0.5 ${tone === 'loading' ? 'animate-spin text-teal-600' : ''}`}
        aria-hidden
      />
      <p className="flex-1 text-sm font-medium whitespace-pre-line leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
};

export default StatusBanner;
