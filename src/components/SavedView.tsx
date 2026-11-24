import React, { useState } from 'react';
import { type User } from 'firebase/auth';
import {
  Cloud,
  DownloadCloud,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Sun,
  Timer,
  Trash2,
} from 'lucide-react';
import { Recipe } from '../types/recipe';
import { PWAInstallButton } from './PWAInstallButton';

interface SavedViewProps {
  user: User | null;
  recipes: Recipe[];
  offlineIds: Set<string>;
  theme: 'light' | 'dark';
  isOnline: boolean;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onRemoveOffline: (recipe: Recipe) => void;
  onCacheAllOffline: () => void;
  onStartCustomTimer: (label: string, minutes: number) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  user,
  recipes,
  offlineIds,
  theme,
  isOnline,
  onToggleTheme,
  onSignIn,
  onSignOut,
  onSelectRecipe,
  onRemoveOffline,
  onCacheAllOffline,
  onStartCustomTimer,
}) => {
  const [timerLabel, setTimerLabel] = useState('Simmer Sauce');
  const [timerMins, setTimerMins] = useState('10');

  const offlineRecipes = recipes.filter((r) => offlineIds.has(r.id));

  const handleTimerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Math.max(1, Math.min(180, Number(timerMins) || 5));
    onStartCustomTimer(timerLabel.trim() || 'Kitchen Timer', mins);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[var(--border-hairline)]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          Offline Library &amp; Sync
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage cached offline dishes, multi-device cloud sync, kitchen timers, and app installation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Cloud Sync, Theme, PWA Install, Custom Timer */}
        <div className="lg:col-span-5 space-y-5">
          {/* Cloud Sync Card */}
          <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-[var(--accent)] shrink-0" />
                <div>
                  <h2 className="font-display text-lg font-semibold">Cloud Sync</h2>
                  <p className="text-xs text-[var(--muted)]">
                    {user
                      ? `Synced as ${user.displayName || user.email}`
                      : 'Sign in with Google to sync meal plans, notes & groceries across devices'}
                  </p>
                </div>
              </div>
            </div>

            {user ? (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border-hairline)]">
                <span className="text-xs text-[var(--muted)] truncate">
                  {user.email} · {isOnline ? 'Connected' : 'Offline queue'}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </button>
            )}
          </section>

          {/* Appearance & App Install */}
          <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold">Kitchen Display &amp; App</h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--background)] hover:bg-[var(--surface-muted)] text-sm font-medium cursor-pointer"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" />
                    Switch to Dark Kitchen
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-[var(--amber-alert)]" />
                    Switch to Light Editorial
                  </>
                )}
              </button>

              <PWAInstallButton />
            </div>
          </section>

          {/* Ad-Hoc Kitchen Timer */}
          <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[var(--amber-alert)]" />
              <h2 className="font-display text-lg font-semibold">Quick Kitchen Timer</h2>
            </div>
            <form onSubmit={handleTimerSubmit} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={timerLabel}
                onChange={(e) => setTimerLabel(e.target.value)}
                placeholder="Label"
                aria-label="Timer label"
                className="flex-1 min-w-[140px] min-h-[44px] px-3 rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] text-sm"
              />
              <input
                type="number"
                min={1}
                max={180}
                value={timerMins}
                onChange={(e) => setTimerMins(e.target.value)}
                aria-label="Minutes"
                className="w-20 min-h-[44px] px-3 rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] text-sm font-mono-num"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[var(--amber-alert)] text-white text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Start
              </button>
            </form>
          </section>
        </div>

        {/* Right: Offline Cached Recipes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Saved for Offline ({offlineRecipes.length})
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Cached in IndexedDB &amp; Service Worker storage for zero-signal cooking
              </p>
            </div>
            <button
              type="button"
              onClick={onCacheAllOffline}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-xs font-medium cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-[var(--accent)]" />
              Download All {recipes.length} Dishes
            </button>
          </div>

          {offlineRecipes.length === 0 ? (
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-8 text-center space-y-2">
              <DownloadCloud className="w-7 h-7 mx-auto text-[var(--muted)]" />
              <p className="font-display text-base font-semibold">No offline recipes cached yet</p>
              <p className="text-sm text-[var(--muted)]">
                Tap Save Offline on any dish or download the full collection above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)] rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] overflow-hidden">
              {offlineRecipes.map((r) => (
                <div
                  key={r.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--surface-muted)]/35 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectRecipe(r)}
                    className="flex-1 flex items-center gap-3.5 text-left min-w-0 cursor-pointer"
                  >
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold truncate">{r.title}</p>
                      <p className="text-xs text-[var(--muted)] font-mono-num mt-0.5">
                        {r.cuisine} · {r.steps.length} offline steps · {r.prepMinutes + r.cookMinutes} min
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveOffline(r)}
                    aria-label={`Remove ${r.title} from offline cache`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-red-600 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
