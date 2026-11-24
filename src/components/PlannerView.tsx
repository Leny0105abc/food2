import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  CalendarPlus,
  ShoppingBasket,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import {
  MealPlanEntry,
  MealReminderSettings,
  MealSlot,
  NutritionGoals,
  NutritionInfo,
  Recipe,
} from '../types/recipe';
import { MacroRings } from './MacroRings';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notifications';

interface PlannerViewProps {
  recipes: Recipe[];
  weekDates: { iso: string; dayShort: string; dayNum: string; fullLabel: string }[];
  mealPlans: MealPlanEntry[];
  goals: NutritionGoals;
  reminders: MealReminderSettings;
  onAssignMeal: (date: string, slot: MealSlot, recipeId: string, servings: number) => void;
  onRemoveMeal: (planId: string) => void;
  onUpdateGoals: (goals: NutritionGoals) => void;
  onUpdateReminders: (settings: MealReminderSettings) => void;
  onGenerateWeeklyGrocery: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onSendTestReminder: () => void;
}

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export const PlannerView: React.FC<PlannerViewProps> = ({
  recipes,
  weekDates,
  mealPlans,
  goals,
  reminders,
  onAssignMeal,
  onRemoveMeal,
  onUpdateGoals,
  onUpdateReminders,
  onGenerateWeeklyGrocery,
  onSelectRecipe,
  onSendTestReminder,
}) => {
  const [selectedDate, setSelectedDate] = useState(weekDates[0]?.iso || '');
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goals);
  const [pickingSlot, setPickingSlot] = useState<MealSlot | null>(null);
  const [permState, setPermState] = useState(getNotificationPermission());

  const recipeById = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((r) => map.set(r.id, r));
    return map;
  }, [recipes]);

  const dayPlans = useMemo(
    () => mealPlans.filter((m) => m.date === selectedDate),
    [mealPlans, selectedDate]
  );

  const dayNutrition = useMemo<NutritionInfo>(() => {
    return dayPlans.reduce(
      (acc, entry) => {
        const r = recipeById.get(entry.recipeId);
        if (!r) return acc;
        return {
          calories: acc.calories + r.nutritionPerServing.calories * entry.servings,
          protein: acc.protein + r.nutritionPerServing.protein * entry.servings,
          carbs: acc.carbs + r.nutritionPerServing.carbs * entry.servings,
          fat: acc.fat + r.nutritionPerServing.fat * entry.servings,
          fiber: acc.fiber + r.nutritionPerServing.fiber * entry.servings,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [dayPlans, recipeById]);

  const handleEnableReminders = async () => {
    const nextEnabled = !reminders.enabled;
    if (nextEnabled) {
      const res = await requestNotificationPermission();
      setPermState(res);
    }
    onUpdateReminders({ ...reminders, enabled: nextEnabled });
  };

  const selectedDayInfo = weekDates.find((d) => d.iso === selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            Weekly Meal Planner &amp; Nutrition
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Track daily calories and macros, schedule meal reminders, and export weekly groceries.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateWeeklyGrocery}
          disabled={mealPlans.length === 0}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium disabled:opacity-45 cursor-pointer shrink-0"
        >
          <ShoppingBasket className="w-4 h-4" />
          Generate Weekly Grocery List
        </button>
      </div>

      {/* Horizontal 7-Day Date Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {weekDates.map((d) => {
          const active = d.iso === selectedDate;
          const count = mealPlans.filter((m) => m.date === d.iso).length;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => setSelectedDate(d.iso)}
              className={`min-h-[56px] min-w-[62px] px-3 py-2 rounded-2xl flex flex-col items-center justify-center transition-colors shrink-0 cursor-pointer border ${
                active
                  ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                  : 'bg-[var(--surface)] border-[var(--border-hairline)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <span className="text-[11px] opacity-75">{d.dayShort}</span>
              <span className="font-mono-num text-base font-semibold leading-tight">
                {d.dayNum}
              </span>
              <span className="text-[10px] font-mono-num opacity-75">
                {count > 0 ? `${count}m` : '—'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Daily Nutrition Rings + Meal Reminders */}
        <div className="lg:col-span-5 space-y-5">
          <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">Daily Macro Rings</h2>
                <p className="text-xs text-[var(--muted)]">{selectedDayInfo?.fullLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGoalDraft(goals);
                  setEditingGoals((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                Goals
              </button>
            </div>

            <MacroRings consumed={dayNutrition} goals={goals} />

            {editingGoals && (
              <div className="pt-4 border-t border-[var(--border-hairline)] space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <label className="space-y-1">
                    <span className="text-[var(--muted)]">Calories (kcal)</span>
                    <input
                      type="number"
                      min={800}
                      max={8000}
                      value={goalDraft.calories}
                      onChange={(e) =>
                        setGoalDraft({ ...goalDraft, calories: Number(e.target.value) || 2000 })
                      }
                      className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-3 font-mono-num"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--muted)]">Protein (g)</span>
                    <input
                      type="number"
                      min={20}
                      max={500}
                      value={goalDraft.protein}
                      onChange={(e) =>
                        setGoalDraft({ ...goalDraft, protein: Number(e.target.value) || 120 })
                      }
                      className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-3 font-mono-num"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--muted)]">Carbs (g)</span>
                    <input
                      type="number"
                      min={10}
                      max={800}
                      value={goalDraft.carbs}
                      onChange={(e) =>
                        setGoalDraft({ ...goalDraft, carbs: Number(e.target.value) || 180 })
                      }
                      className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-3 font-mono-num"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--muted)]">Fat (g)</span>
                    <input
                      type="number"
                      min={10}
                      max={400}
                      value={goalDraft.fat}
                      onChange={(e) =>
                        setGoalDraft({ ...goalDraft, fat: Number(e.target.value) || 70 })
                      }
                      className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-3 font-mono-num"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateGoals(goalDraft);
                    setEditingGoals(false);
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-medium cursor-pointer"
                >
                  Save Nutrition Targets
                </button>
              </div>
            )}
          </section>

          {/* Meal Reminders & Push Alerts */}
          <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[var(--accent)]" />
                <div>
                  <h3 className="font-display text-base font-semibold">Meal Reminders</h3>
                  <p className="text-xs text-[var(--muted)]">
                    Push notifications at scheduled meal times
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnableReminders}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  reminders.enabled
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--foreground)]'
                }`}
              >
                {reminders.enabled ? 'Enabled' : 'Enable'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <label className="space-y-1">
                <span className="text-[var(--muted)]">Breakfast</span>
                <input
                  type="time"
                  value={reminders.breakfastTime}
                  onChange={(e) =>
                    onUpdateReminders({ ...reminders, breakfastTime: e.target.value })
                  }
                  className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-2 font-mono-num"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[var(--muted)]">Lunch</span>
                <input
                  type="time"
                  value={reminders.lunchTime}
                  onChange={(e) =>
                    onUpdateReminders({ ...reminders, lunchTime: e.target.value })
                  }
                  className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-2 font-mono-num"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[var(--muted)]">Dinner</span>
                <input
                  type="time"
                  value={reminders.dinnerTime}
                  onChange={(e) =>
                    onUpdateReminders({ ...reminders, dinnerTime: e.target.value })
                  }
                  className="w-full min-h-[40px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-2 font-mono-num"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <span className="text-[11px] text-[var(--muted)]">
                Browser permission: {permState}
              </span>
              <button
                type="button"
                onClick={onSendTestReminder}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-[var(--amber-alert)]" />
                Test Alert
              </button>
            </div>
          </section>
        </div>

        {/* Right: Daily Meal Slots */}
        <div className="lg:col-span-7 space-y-3">
          {SLOTS.map((slot) => {
            const entry = dayPlans.find((m) => m.slot === slot.key);
            const recipe = entry ? recipeById.get(entry.recipeId) : undefined;

            return (
              <div
                key={slot.key}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {recipe ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      referrerPolicy="no-referrer"
                      onClick={() => onSelectRecipe(recipe)}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 cursor-pointer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center shrink-0 text-[var(--muted)]">
                      <CalendarPlus className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--accent)]">{slot.label}</p>
                    {recipe && entry ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectRecipe(recipe)}
                          className="font-display text-base font-semibold text-left hover:text-[var(--accent)] truncate block max-w-full cursor-pointer"
                        >
                          {recipe.title}
                        </button>
                        <p className="text-xs font-mono-num text-[var(--muted)] mt-0.5">
                          {entry.servings} serving{entry.servings > 1 ? 's' : ''} ·{' '}
                          {recipe.nutritionPerServing.calories * entry.servings} kcal ·{' '}
                          {recipe.nutritionPerServing.protein * entry.servings}g P
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-[var(--muted)] mt-0.5">No dish scheduled</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {entry && (
                    <button
                      type="button"
                      onClick={() => onRemoveMeal(entry.id)}
                      aria-label={`Remove ${slot.label} dish`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPickingSlot(slot.key)}
                    className="min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--background)] hover:bg-[var(--surface-muted)] text-xs font-medium cursor-pointer"
                  >
                    {recipe ? 'Swap Dish' : 'Add Dish'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dish Picker Modal */}
      {pickingSlot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Choose recipe for ${pickingSlot}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
          onClick={() => setPickingSlot(null)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[80dvh] rounded-t-3xl sm:rounded-3xl bg-[var(--surface)] border border-[var(--border-hairline)] p-5 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold capitalize">
                Select {pickingSlot} Dish
              </h3>
              <button
                type="button"
                onClick={() => setPickingSlot(null)}
                aria-label="Close picker"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-[var(--border-hairline)]">
              {recipes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onAssignMeal(selectedDate, pickingSlot, r.id, 1);
                    setPickingSlot(null);
                  }}
                  className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--surface-muted)] px-2 rounded-xl cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-xs text-[var(--muted)] font-mono-num">
                        {r.cuisine} · {r.nutritionPerServing.calories} kcal ·{' '}
                        {r.nutritionPerServing.protein}g P
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[var(--accent)] shrink-0">Select</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
