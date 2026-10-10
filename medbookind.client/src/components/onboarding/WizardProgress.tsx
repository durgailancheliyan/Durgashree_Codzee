import React from 'react';
import { CheckCircle2, type LucideIcon } from 'lucide-react';

export type WizardStepMeta = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

type WizardProgressProps = {
  steps: WizardStepMeta[];
  currentIndex: number;
  progressPercent: number;
  checklistPercent: number;
  checklistItems: Array<{ key: string; label: string; done: boolean }>;
  onStepSelect: (index: number) => void;
};

const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentIndex,
  progressPercent,
  checklistPercent,
  checklistItems,
  onStepSelect,
}) => {
  const current = steps[currentIndex];

  return (
    <header className="relative overflow-hidden border-b border-teal-100/80 bg-gradient-to-br from-blue-600 via-teal-600 to-cyan-500 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2), transparent 35%)',
        }}
        aria-hidden
      />

      <div className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-teal-100">
              MedBookInd onboarding
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
              Set up your practice
            </h1>
            <p className="mt-2 text-sm sm:text-base text-blue-50/90 max-w-xl">
              {current?.description ?? 'Complete each step to go live.'}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 border border-white/20 min-w-[7.5rem]">
              <p className="text-[11px] uppercase tracking-wide text-teal-100">Step</p>
              <p className="text-xl font-bold tabular-nums">
                {currentIndex + 1}
                <span className="text-sm font-medium text-teal-100"> / {steps.length}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 border border-white/20 min-w-[7.5rem]">
              <p className="text-[11px] uppercase tracking-wide text-teal-100">Checklist</p>
              <p className="text-xl font-bold tabular-nums">{checklistPercent}%</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-teal-50 mb-1.5">
            <span>Wizard progress</span>
            <span className="tabular-nums font-semibold">{progressPercent}%</span>
          </div>
          <div
            className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Onboarding wizard progress"
          >
            <div
              className="h-full rounded-full bg-white shadow-sm transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Setup checklist">
          {checklistItems.map((item) => (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                item.done
                  ? 'bg-white text-teal-800 border-white'
                  : 'bg-white/10 text-teal-50 border-white/25'
              }`}
            >
              {item.done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
              {item.label}
            </span>
          ))}
        </div>

        <nav aria-label="Onboarding steps" className="pt-1">
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const done = index < currentIndex;
              const active = index === currentIndex;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => onStepSelect(index)}
                    aria-current={active ? 'step' : undefined}
                    className={`group w-full text-left rounded-2xl border px-3 py-3 sm:px-3.5 sm:py-3.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-600 ${
                      active
                        ? 'bg-white text-slate-900 border-white shadow-lg shadow-teal-900/20 scale-[1.02]'
                        : done
                          ? 'bg-teal-500/30 text-white border-white/30 hover:bg-teal-500/45'
                          : 'bg-white/10 text-teal-50 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          active
                            ? 'bg-teal-50 border-teal-200 text-teal-700'
                            : done
                              ? 'bg-white/20 border-white/40'
                              : 'bg-white/10 border-white/20'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5" aria-hidden />
                        ) : (
                          <Icon className="h-4.5 w-4.5 h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wide opacity-80">
                          Step {index + 1}
                        </span>
                        <span
                          className={`block text-xs sm:text-sm font-semibold truncate ${
                            active ? 'text-slate-900' : ''
                          }`}
                        >
                          <span className="sm:hidden">{step.shortLabel}</span>
                          <span className="hidden sm:inline">{step.label}</span>
                        </span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
};

export default WizardProgress;
