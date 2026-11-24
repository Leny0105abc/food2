import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  DownloadCloud,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  UtensilsCrossed,
} from 'lucide-react';
import { Cuisine, DietaryTag, Recipe, SkillLevel } from '../types/recipe';

interface RecipesViewProps {
  recipes: Recipe[];
  offlineIds: Set<string>;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleOfflineSave: (recipe: Recipe) => void;
  onShareRecipe: (recipe: Recipe) => void;
}

const CUISINES: ('All' | Cuisine)[] = ['All', 'Filipino', 'Chinese', 'Italian', 'International'];
const DIETARY_OPTIONS: DietaryTag[] = [
  'Keto',
  'Gluten-Free',
  'Dairy-Free',
  'Vegetarian',
  'Halal-Friendly',
  'Low-Carb',
];
const SKILL_LEVELS: ('All' | SkillLevel)[] = ['All', 'Beginner', 'Intermediate', 'Chef'];

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  offlineIds,
  onSelectRecipe,
  onToggleOfflineSave,
  onShareRecipe,
}) => {
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState<'All' | Cuisine>('All');
  const [selectedDietary, setSelectedDietary] = useState<DietaryTag[]>([]);
  const [skill, setSkill] = useState<'All' | SkillLevel>('All');
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggleDietary = (tag: DietaryTag) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetAll = () => {
    setSearch('');
    setCuisine('All');
    setSelectedDietary([]);
    setSkill('All');
    setOfflineOnly(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (cuisine !== 'All' && r.cuisine !== cuisine) return false;
      if (skill !== 'All' && r.skillLevel !== skill) return false;
      if (offlineOnly && !offlineIds.has(r.id)) return false;
      if (selectedDietary.length > 0) {
        const hasAll = selectedDietary.every((tag) => r.dietaryTags.includes(tag));
        if (!hasAll) return false;
      }
      if (q) {
        const hay = `${r.title} ${r.subtitle} ${r.cuisine} ${r.ingredients
          .map((i) => i.name)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, cuisine, skill, offlineOnly, offlineIds, selectedDietary, search]);

  const activeFilterCount =
    selectedDietary.length + (skill !== 'All' ? 1 : 0) + (offlineOnly ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Editorial Intro + Search */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[var(--border-hairline)]">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-[var(--accent)]">
            Filipino · Chinese · Italian · International
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-balance">
            Home Kitchen Recipes Built for Offline Cooking
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Step-by-step video tutorial cards, live timers, dietary filters, and cloud-synced meal planning.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-96">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes or ingredients..."
              aria-label="Search dishes or ingredients"
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[var(--surface)] border border-[var(--border-hairline)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 rounded-xl border text-sm font-medium cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--border-hairline)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>
        </div>
      </section>

      {/* Cuisine Segmented Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CUISINES.map((c) => {
          const active = cuisine === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine(c)}
              className={`min-h-[44px] px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface)] border border-[var(--border-hairline)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Expandable Dietary & Skill Filter Drawer */}
      {showFilters && (
        <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Dietary Restrictions &amp; Skill Level</h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset all
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((tag) => {
              const active = selectedDietary.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietary(tag)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--background)] border-[var(--border-hairline)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-hairline)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {SKILL_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSkill(lvl)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    skill === lvl
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {lvl === 'All' ? 'All Skill Levels' : lvl}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOfflineOnly((v) => !v)}
              className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-xl text-xs font-medium border cursor-pointer ${
                offlineOnly
                  ? 'bg-[var(--amber-alert)] text-white border-[var(--amber-alert)]'
                  : 'bg-[var(--background)] border-[var(--border-hairline)] text-[var(--foreground)]'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              Offline Cached Only ({offlineIds.size})
            </button>
          </div>
        </section>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-mono-num">
          Showing {filtered.length} of {recipes.length} curated dishes
        </span>
        {selectedDietary.length > 0 && (
          <span>Filtered: {selectedDietary.join(' · ')}</span>
        )}
      </div>

      {/* Recipe Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-10 text-center space-y-3">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-[var(--muted)]" />
          <h3 className="font-display text-lg font-semibold">No matching dishes found</h3>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
            Try clearing one of your dietary filters or switching to another cuisine.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => {
            const isSaved = offlineIds.has(recipe.id);
            const totalMin = recipe.prepMinutes + recipe.cookMinutes;

            return (
              <article
                key={recipe.id}
                className="group rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectRecipe(recipe)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRecipe(recipe);
                    }
                  }}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200 dark:bg-stone-800 cursor-pointer"
                >
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                  <span className="absolute bottom-2.5 left-3 text-xs font-mono-num font-medium text-white">
                    {recipe.steps.length} video steps · {totalMin} min
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                  <div
                    onClick={() => onSelectRecipe(recipe)}
                    className="space-y-1.5 cursor-pointer"
                  >
                    <p className="text-xs text-[var(--muted)] font-mono-num">
                      {recipe.cuisine} · {recipe.skillLevel} · {recipe.nutritionPerServing.calories} kcal
                    </p>
                    <h2 className="font-display text-lg font-semibold leading-snug text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                      {recipe.title}
                    </h2>
                    <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {recipe.subtitle}
                    </p>
                    {recipe.dietaryTags.length > 0 && (
                      <p className="text-xs text-[var(--accent)] pt-1">
                        {recipe.dietaryTags.join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectRecipe(recipe)}
                      className="min-h-[44px] px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium cursor-pointer transition-colors"
                    >
                      View &amp; Cook
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleOfflineSave(recipe)}
                        aria-label={isSaved ? 'Remove offline copy' : 'Save recipe offline'}
                        title={isSaved ? 'Saved for offline' : 'Save for offline'}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                          isSaved
                            ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                            : 'text-[var(--muted)] hover:bg-[var(--surface-muted)]'
                        }`}
                      >
                        {isSaved ? (
                          <Bookmark className="w-4 h-4 fill-current" />
                        ) : (
                          <DownloadCloud className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onShareRecipe(recipe)}
                        aria-label={`Share ${recipe.title}`}
                        title="Share dish"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
