import React, { useState } from 'react';
import {
  Bookmark,
  CalendarPlus,
  Check,
  DownloadCloud,
  Flame,
  Play,
  Share2,
  ShoppingBasket,
  X,
} from 'lucide-react';
import { MealSlot, Recipe } from '../types/recipe';
import { StepVideoCard } from './StepVideoCard';

interface RecipeDetailSheetProps {
  recipe: Recipe;
  isOfflineSaved: boolean;
  personalNote: string;
  availableDates: { iso: string; label: string }[];
  onClose: () => void;
  onToggleOfflineSave: (recipe: Recipe) => void;
  onSaveNote: (recipeId: string, note: string) => void;
  onAddIngredientsToGrocery: (recipe: Recipe, servings: number) => void;
  onAddToMealPlan: (date: string, slot: MealSlot, recipeId: string, servings: number) => void;
  onStartCookMode: (recipe: Recipe, servings: number) => void;
  onOpenShare: (recipe: Recipe, servings: number) => void;
}

export const RecipeDetailSheet: React.FC<RecipeDetailSheetProps> = ({
  recipe,
  isOfflineSaved,
  personalNote,
  availableDates,
  onClose,
  onToggleOfflineSave,
  onSaveNote,
  onAddIngredientsToGrocery,
  onAddToMealPlan,
  onStartCookMode,
  onOpenShare,
}) => {
  const [servings, setServings] = useState(recipe.baseServings);
  const [noteDraft, setNoteDraft] = useState(personalNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.iso || '');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('dinner');
  const [previewStepIndex, setPreviewStepIndex] = useState(0);

  const scale = servings / recipe.baseServings;

  const handleSaveNoteClick = () => {
    onSaveNote(recipe.id, noteDraft);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title}
      className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/55 backdrop-blur-sm md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-4xl h-[92dvh] md:h-auto md:max-h-[90dvh] rounded-t-3xl md:rounded-3xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-hairline)] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Media Header */}
        <div className="relative h-60 sm:h-72 w-full bg-stone-200 dark:bg-stone-800">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenShare(recipe, servings)}
              aria-label="Share recipe"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close recipe details"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-xs text-white/85 font-medium">
              {recipe.cuisine} · {recipe.skillLevel} · {recipe.prepMinutes + recipe.cookMinutes} min
              {recipe.dietaryTags.length > 0 ? ` · ${recipe.dietaryTags.join(' · ')}` : ''}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1 text-balance">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 space-y-7">
          {/* Quick Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--border-hairline)]">
            <p className="text-sm text-[var(--muted)] max-w-xl leading-relaxed">
              {recipe.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggleOfflineSave(recipe)}
                className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                  isOfflineSaved
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--surface)] border-[var(--border-hairline)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {isOfflineSaved ? (
                  <Bookmark className="w-4 h-4 fill-current" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
                <span>{isOfflineSaved ? 'Saved Offline' : 'Save Offline'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPlanPicker((v) => !v)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Plan Meal</span>
              </button>

              <button
                type="button"
                onClick={() => onStartCookMode(recipe, servings)}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Start Cook Mode</span>
              </button>
            </div>
          </div>

          {/* Inline Meal Plan Assignment Drawer */}
          {showPlanPicker && (
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-4 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Day
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-3 text-sm"
                >
                  {availableDates.map((d) => (
                    <option key={d.iso} value={d.iso}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Meal Slot
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value as MealSlot)}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--background)] border border-[var(--border-hairline)] px-3 text-sm capitalize"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddToMealPlan(selectedDate, selectedSlot, recipe.id, 1);
                  setShowPlanPicker(false);
                }}
                className="min-h-[44px] px-5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer"
              >
                Confirm Slot
              </button>
            </div>
          )}

          {/* Nutrition & Servings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Servings & Ingredients */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">Ingredients</h3>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-muted)]">
                  {[1, 2, 4].map((mult) => {
                    const target = recipe.baseServings * mult;
                    const active = servings === target;
                    return (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => setServings(target)}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-mono-num font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {mult}x ({target})
                      </button>
                    );
                  })}
                </div>
              </div>

              <ul className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-[var(--foreground)]">{ing.name}</span>
                    <span className="font-mono-num text-[var(--muted)] whitespace-nowrap shrink-0">
                      {Number((ing.amount * scale).toFixed(1))} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onAddIngredientsToGrocery(recipe, servings)}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-sm font-medium cursor-pointer"
              >
                <ShoppingBasket className="w-4 h-4 text-[var(--accent)]" />
                Add {servings} Servings to Grocery List
              </button>
            </section>

            {/* Per-Serving Nutrition & Video Step Preview */}
            <section className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold">Nutrition per Serving</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-mono-num text-[var(--muted)]">
                    <Flame className="w-3.5 h-3.5 text-[var(--amber-alert)]" />
                    {recipe.nutritionPerServing.calories} kcal
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-3">
                  <div>
                    <p className="font-mono-num text-base font-semibold">
                      {recipe.nutritionPerServing.protein}g
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">Protein</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-base font-semibold">
                      {recipe.nutritionPerServing.carbs}g
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">Carbs</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-base font-semibold">
                      {recipe.nutritionPerServing.fat}g
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">Fat</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-base font-semibold">
                      {recipe.nutritionPerServing.fiber}g
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">Fiber</p>
                  </div>
                </div>
              </div>

              {/* Interactive Step Video Card Preview */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Step Video Tutorial</h3>
                  <div className="flex items-center gap-1">
                    {recipe.steps.map((s, idx) => (
                      <button
                        key={s.stepNumber}
                        type="button"
                        onClick={() => setPreviewStepIndex(idx)}
                        className={`min-h-[36px] min-w-[36px] rounded-lg text-xs font-mono-num font-semibold cursor-pointer ${
                          previewStepIndex === idx
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--surface-muted)] text-[var(--muted)]'
                        }`}
                      >
                        {s.stepNumber}
                      </button>
                    ))}
                  </div>
                </div>
                <StepVideoCard
                  step={recipe.steps[previewStepIndex]}
                  imageUrl={recipe.imageUrl}
                  dishTitle={recipe.title}
                  compact
                />
              </div>
            </section>
          </div>

          {/* Personal Cook Notes */}
          <section className="pt-4 border-t border-[var(--border-hairline)] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="personal-note" className="font-display text-base font-semibold">
                Personal Kitchen Notes
              </label>
              {noteSaved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                id="personal-note"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value.slice(0, 600))}
                placeholder="Add adjustments (e.g., extra calamansi, less chili, family favorite)..."
                rows={2}
                className="flex-1 rounded-xl bg-[var(--surface)] border border-[var(--border-hairline)] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={handleSaveNoteClick}
                className="min-h-[44px] px-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-sm font-medium cursor-pointer shrink-0 self-end sm:self-stretch"
              >
                Save Note
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
