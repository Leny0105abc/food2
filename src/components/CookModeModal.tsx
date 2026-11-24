import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Play,
  X,
} from 'lucide-react';
import { ActiveTimer, Recipe } from '../types/recipe';
import { StepVideoCard } from './StepVideoCard';

interface CookModeModalProps {
  recipe: Recipe;
  servings: number;
  activeTimers: ActiveTimer[];
  onStartTimer: (label: string, recipeTitle: string, durationSeconds: number) => void;
  onClose: () => void;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CookModeModal: React.FC<CookModeModalProps> = ({
  recipe,
  servings,
  activeTimers,
  onStartTimer,
  onClose,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [wakeLocked, setWakeLocked] = useState(false);

  const step = recipe.steps[stepIndex];
  const isLast = stepIndex === recipe.steps.length - 1;

  useEffect(() => {
    let sentinel: { release: () => Promise<void> } | null = null;
    const nav = navigator as unknown as {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };
    if (nav.wakeLock) {
      nav.wakeLock
        .request('screen')
        .then((s) => {
          sentinel = s;
          setWakeLocked(true);
        })
        .catch(() => setWakeLocked(false));
    }
    return () => {
      if (sentinel) {
        sentinel.release().catch(() => undefined);
      }
    };
  }, []);

  const matchingTimer = activeTimers.find(
    (t) => t.recipeTitle === recipe.title && t.label === (step.timerLabel || step.title)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Guided Cook Mode for ${recipe.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-y-auto"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 h-14 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border-hairline)]">
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-lg font-semibold truncate">
            {recipe.title}
          </h2>
          <p className="text-xs text-[var(--muted)] font-mono-num">
            Step {stepIndex + 1} of {recipe.steps.length} · {servings} servings
            {wakeLocked ? ' · Screen awake' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit cook mode"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[var(--surface-muted)] cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Progress Strip */}
      <div className="w-full h-1 bg-[var(--surface-muted)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-200"
          style={{ width: `${((stepIndex + 1) / recipe.steps.length) * 100}%` }}
        />
      </div>

      {/* Main Guided Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
        <StepVideoCard
          step={step}
          imageUrl={recipe.imageUrl}
          dishTitle={recipe.title}
        />

        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 sm:p-6 space-y-4">
          <p className="text-base sm:text-lg leading-relaxed text-[var(--foreground)]">
            {step.instruction}
          </p>

          {step.durationSeconds >= 60 && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)]">
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Clock className="w-4 h-4 text-[var(--amber-alert)]" />
                <span>Recommended step timer:</span>
                <span className="font-mono-num font-semibold text-[var(--foreground)]">
                  {formatClock(step.durationSeconds)}
                </span>
              </div>
              {matchingTimer ? (
                <span className="font-mono-num text-sm font-semibold text-[var(--amber-alert)]">
                  {matchingTimer.completed
                    ? 'Timer complete'
                    : `Running: ${formatClock(matchingTimer.remainingSeconds)}`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onStartTimer(
                      step.timerLabel || step.title,
                      recipe.title,
                      step.durationSeconds
                    )
                  }
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[var(--amber-alert)] hover:opacity-90 text-white text-sm font-medium cursor-pointer transition-opacity"
                >
                  <Play className="w-4 h-4" />
                  Start {Math.round(step.durationSeconds / 60)}m Timer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step Quick-Jump Dots */}
        <div className="flex items-center justify-center gap-2">
          {recipe.steps.map((s, idx) => (
            <button
              key={s.stepNumber}
              type="button"
              onClick={() => setStepIndex(idx)}
              aria-label={`Go to step ${s.stepNumber}`}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs font-mono-num font-semibold transition-colors cursor-pointer ${
                idx === stepIndex
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border-hairline)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {s.stepNumber}
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-20 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border-hairline)] px-4 sm:px-6 py-3 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-sm font-medium disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {wakeLocked && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Lock className="w-3.5 h-3.5" />
              Wake lock active
            </span>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finish Dish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(recipe.steps.length - 1, i + 1))}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium cursor-pointer"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
