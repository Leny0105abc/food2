import React from 'react';
import { BellRing, Pause, Play, Plus, X } from 'lucide-react';
import { ActiveTimer } from '../types/recipe';

interface ActiveTimersBarProps {
  timers: ActiveTimer[];
  onToggleTimer: (id: string) => void;
  onAddMinute: (id: string) => void;
  onDismissTimer: (id: string) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ActiveTimersBar: React.FC<ActiveTimersBarProps> = ({
  timers,
  onToggleTimer,
  onAddMinute,
  onDismissTimer,
}) => {
  if (timers.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 left-4 md:left-auto z-30 flex flex-col gap-2 md:w-80">
      {timers.map((timer) => (
        <div
          key={timer.id}
          className={`flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 shadow-lg border backdrop-blur-md ${
            timer.completed
              ? 'bg-[var(--amber-alert)] text-white border-amber-400'
              : 'bg-[var(--surface)]/95 text-[var(--foreground)] border-[var(--border-hairline)]'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {timer.completed && <BellRing className="w-3.5 h-3.5 shrink-0" />}
              <p className="text-xs font-semibold truncate">{timer.label}</p>
            </div>
            <p
              className={`font-mono-num text-sm font-bold ${
                timer.completed ? 'text-white' : 'text-[var(--amber-alert)]'
              }`}
            >
              {timer.completed ? 'Time is up!' : formatTime(timer.remainingSeconds)}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!timer.completed && (
              <>
                <button
                  type="button"
                  onClick={() => onToggleTimer(timer.id)}
                  aria-label={timer.isRunning ? 'Pause timer' : 'Resume timer'}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-black/10 cursor-pointer"
                >
                  {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => onAddMinute(timer.id)}
                  aria-label="Add one minute"
                  className="min-h-[44px] px-2 flex items-center justify-center rounded-xl hover:bg-black/10 text-xs font-mono-num font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />1m
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onDismissTimer(timer.id)}
              aria-label="Dismiss timer"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-black/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
