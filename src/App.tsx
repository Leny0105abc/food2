import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  LogIn,
  ShoppingBasket,
  Utensils,
} from 'lucide-react';
import { RECIPES } from './data/recipes';
import {
  ActiveTimer,
  AisleCategory,
  AppTab,
  GroceryItem,
  MealPlanEntry,
  MealReminderSettings,
  MealSlot,
  NutritionGoals,
  Recipe,
  SavedRecipeMeta,
} from './types/recipe';
import { auth, signInWithGoogle, signOutUser, testConnection } from './services/firebase';
import {
  deleteGroceryItemCloud,
  deleteMealPlanCloud,
  ensureUserProfile,
  subscribeUserCloudData,
  toggleGroceryItemCloud,
  updateUserProfilePatch,
  upsertGroceryItemCloud,
  upsertMealPlanCloud,
  upsertSavedRecipeCloud,
} from './services/cloudSync';
import {
  cacheRecipeForOffline,
  getOfflineCachedRecipes,
  loadLocalGroceryItems,
  loadLocalMealPlans,
  loadLocalNutritionGoals,
  loadLocalReminders,
  loadLocalSavedMeta,
  loadLocalTheme,
  removeOfflineRecipeCache,
  saveLocalGroceryItems,
  saveLocalMealPlans,
  saveLocalNutritionGoals,
  saveLocalReminders,
  saveLocalSavedMeta,
  saveLocalTheme,
} from './services/offlineStorage';
import {
  playTimerChime,
  requestNotificationPermission,
  sendKitchenNotification,
} from './services/notifications';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ActiveTimersBar } from './components/ActiveTimersBar';
import { RecipesView } from './components/RecipesView';
import { PlannerView } from './components/PlannerView';
import { GroceryView } from './components/GroceryView';
import { SavedView } from './components/SavedView';
import { RecipeDetailSheet } from './components/RecipeDetailSheet';
import { CookModeModal } from './components/CookModeModal';
import { ShareSheet } from './components/ShareSheet';

function getWeekDates(): {
  iso: string;
  dayShort: string;
  dayNum: string;
  fullLabel: string;
}[] {
  const days: { iso: string; dayShort: string; dayNum: string; fullLabel: string }[] = [];
  const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullLabel =
      i === 0
        ? `Today · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    days.push({ iso, dayShort, dayNum: dd, fullLabel });
  }
  return days;
}

export default function App() {
  const isOnline = useOnlineStatus();
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayIso = weekDates[0]?.iso || '2026-11-23';

  const [activeTab, setActiveTab] = useState<AppTab>('recipes');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadLocalTheme());
  const [user, setUser] = useState<User | null>(null);

  const [savedMeta, setSavedMeta] = useState<Record<string, SavedRecipeMeta>>(() =>
    loadLocalSavedMeta()
  );
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());
  const [mealPlans, setMealPlans] = useState<MealPlanEntry[]>(() =>
    loadLocalMealPlans(todayIso)
  );
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() =>
    loadLocalGroceryItems()
  );
  const [goals, setGoals] = useState<NutritionGoals>(() => loadLocalNutritionGoals());
  const [reminders, setReminders] = useState<MealReminderSettings>(() =>
    loadLocalReminders()
  );

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookSession, setCookSession] = useState<{ recipe: Recipe; servings: number } | null>(
    null
  );
  const [shareSession, setShareSession] = useState<{ recipe: Recipe; servings: number } | null>(
    null
  );
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const firedRemindersRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveLocalTheme(theme);
  }, [theme]);

  // Startup Firestore connection check & IndexedDB offline hydration + shared URL deep-link
  useEffect(() => {
    testConnection();
    getOfflineCachedRecipes().then((cached) => {
      setOfflineIds(new Set(cached.map((r) => r.id)));
    });

    const params = new URLSearchParams(window.location.search);
    const dishId = params.get('dish');
    if (dishId) {
      const found = RECIPES.find((r) => r.id === dishId);
      if (found) setSelectedRecipe(found);
    }
  }, []);

  // Firebase Auth + Real-Time Cloud Sync
  useEffect(() => {
    let unsubCloud: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      if (unsubCloud) {
        unsubCloud();
        unsubCloud = null;
      }
      setUser(nextUser);

      if (nextUser) {
        const isNewProfile = await ensureUserProfile(nextUser, { goals, reminders, theme });
        if (isNewProfile) {
          const localSaved = Object.values(loadLocalSavedMeta());
          const localPlans = loadLocalMealPlans(todayIso);
          const localGroceries = loadLocalGroceryItems();
          await Promise.all([
            ...localSaved.map((m) => upsertSavedRecipeCloud(nextUser.uid, m)),
            ...localPlans.map((p) => upsertMealPlanCloud(nextUser.uid, p)),
            ...localGroceries.map((g) => upsertGroceryItemCloud(nextUser.uid, g)),
          ]);
        }
        unsubCloud = subscribeUserCloudData(nextUser.uid, {
          onProfile: (profile) => {
            setGoals({
              calories: profile.calorieGoal,
              protein: profile.proteinGoal,
              carbs: profile.carbsGoal,
              fat: profile.fatGoal,
            });
            setReminders({
              enabled: profile.remindersEnabled,
              breakfastTime: profile.breakfastTime,
              lunchTime: profile.lunchTime,
              dinnerTime: profile.dinnerTime,
            });
            setTheme(profile.theme);
          },
          onSavedRecipes: (cloudSaved) => {
            setSavedMeta(cloudSaved);
            saveLocalSavedMeta(cloudSaved);
            // Automatically ensure cloud-pinned offline recipes are cached locally on this device too
            Object.values(cloudSaved).forEach((m) => {
              if (m.offlinePinned) {
                const r = RECIPES.find((item) => item.id === m.recipeId);
                if (r) {
                  cacheRecipeForOffline(r).then(() => {
                    setOfflineIds((prev) => new Set(prev).add(r.id));
                  });
                }
              }
            });
          },
          onMealPlans: (cloudPlans) => {
            setMealPlans(cloudPlans);
            saveLocalMealPlans(cloudPlans);
          },
          onGroceryItems: (cloudItems) => {
            setGroceryItems(cloudItems);
            saveLocalGroceryItems(cloudItems);
          },
        });
      }
    });

    return () => {
      unsubAuth();
      if (unsubCloud) unsubCloud();
    };
  }, []);

  // Real-time cooking countdown timers
  useEffect(() => {
    const hasRunning = timers.some((t) => t.isRunning && !t.completed);
    if (!hasRunning) return;

    const interval = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning || t.completed) return t;
          if (t.remainingSeconds <= 1) {
            playTimerChime();
            sendKitchenNotification(
              'Cooking Timer Complete',
              `${t.label} (${t.recipeTitle}) is ready!`,
              t.id
            );
            showToast(`Timer done: ${t.label}`);
            return { ...t, remainingSeconds: 0, isRunning: false, completed: true };
          }
          return { ...t, remainingSeconds: t.remainingSeconds - 1 };
        })
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timers, showToast]);

  // Scheduled meal reminder checker
  useEffect(() => {
    if (!reminders.enabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const dayKey = now.toISOString().slice(0, 10);

      const slots: { slot: MealSlot; time: string; label: string }[] = [
        { slot: 'breakfast', time: reminders.breakfastTime, label: 'Breakfast' },
        { slot: 'lunch', time: reminders.lunchTime, label: 'Lunch' },
        { slot: 'dinner', time: reminders.dinnerTime, label: 'Dinner' },
      ];

      slots.forEach((s) => {
        const key = `${dayKey}_${s.slot}_${s.time}`;
        if (hhmm === s.time && !firedRemindersRef.current.has(key)) {
          firedRemindersRef.current.add(key);
          const planned = mealPlans.find((m) => m.date === dayKey && m.slot === s.slot);
          const recipe = planned ? RECIPES.find((r) => r.id === planned.recipeId) : null;
          const body = recipe
            ? `Time to start ${recipe.title} (${recipe.prepMinutes + recipe.cookMinutes} min)`
            : `Scheduled ${s.label} reminder from Kusina & Co.`;
          playTimerChime();
          sendKitchenNotification(`${s.label} Kitchen Reminder`, body, key);
          showToast(`${s.label} reminder: ${recipe ? recipe.title : 'Meal time'}`);
        }
      });
    };

    checkSchedule();
    const id = window.setInterval(checkSchedule, 30000);
    return () => window.clearInterval(id);
  }, [reminders, mealPlans, showToast]);

  // Actions
  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (user) {
      updateUserProfilePatch(user.uid, { theme: next });
    }
  };

  const handleSignIn = async () => {
    try {
      const signedInUser = await signInWithGoogle();
      showToast(`Signed in as ${signedInUser.displayName || signedInUser.email}`);
    } catch (err) {
      showToast('Google Sign-In was cancelled or blocked');
      console.warn(err);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    showToast('Signed out — local offline drafts preserved');
  };

  const handleToggleOfflineSave = async (recipe: Recipe) => {
    const currentlySaved = offlineIds.has(recipe.id);
    const nextSaved = !currentlySaved;

    if (nextSaved) {
      await cacheRecipeForOffline(recipe);
      setOfflineIds((prev) => new Set(prev).add(recipe.id));
      showToast(`${recipe.title} saved for offline cooking`);
    } else {
      await removeOfflineRecipeCache(recipe.id);
      setOfflineIds((prev) => {
        const copy = new Set(prev);
        copy.delete(recipe.id);
        return copy;
      });
      showToast(`Removed ${recipe.title} from offline cache`);
    }

    const existingNote = savedMeta[recipe.id]?.personalNote || '';
    const updatedMeta: SavedRecipeMeta = {
      recipeId: recipe.id,
      offlinePinned: nextSaved,
      personalNote: existingNote,
    };
    const nextMap = { ...savedMeta, [recipe.id]: updatedMeta };
    setSavedMeta(nextMap);
    saveLocalSavedMeta(nextMap);

    if (user) {
      await upsertSavedRecipeCloud(user.uid, updatedMeta);
    }
  };

  const handleCacheAllOffline = async () => {
    await Promise.all(RECIPES.map((r) => cacheRecipeForOffline(r)));
    setOfflineIds(new Set(RECIPES.map((r) => r.id)));
    showToast(`All ${RECIPES.length} recipes cached for offline use`);
  };

  const handleSaveNote = async (recipeId: string, note: string) => {
    const updatedMeta: SavedRecipeMeta = {
      recipeId,
      offlinePinned: offlineIds.has(recipeId),
      personalNote: note.slice(0, 600),
    };
    const nextMap = { ...savedMeta, [recipeId]: updatedMeta };
    setSavedMeta(nextMap);
    saveLocalSavedMeta(nextMap);
    showToast('Kitchen note saved');

    if (user) {
      await upsertSavedRecipeCloud(user.uid, updatedMeta);
    }
  };

  const handleAssignMeal = async (
    date: string,
    slot: MealSlot,
    recipeId: string,
    servings: number
  ) => {
    const entry: MealPlanEntry = {
      id: `${date}_${slot}`,
      date,
      slot,
      recipeId,
      servings,
    };
    const next = [...mealPlans.filter((m) => m.id !== entry.id), entry];
    setMealPlans(next);
    saveLocalMealPlans(next);
    const r = RECIPES.find((item) => item.id === recipeId);
    showToast(`Planned ${r?.title || 'dish'} for ${slot}`);

    if (user) {
      await upsertMealPlanCloud(user.uid, entry);
    }
  };

  const handleRemoveMeal = async (planId: string) => {
    const next = mealPlans.filter((m) => m.id !== planId);
    setMealPlans(next);
    saveLocalMealPlans(next);
    if (user) {
      await deleteMealPlanCloud(user.uid, planId);
    }
  };

  const handleUpdateGoals = async (nextGoals: NutritionGoals) => {
    setGoals(nextGoals);
    saveLocalNutritionGoals(nextGoals);
    showToast('Nutrition targets updated');
    if (user) {
      await updateUserProfilePatch(user.uid, {
        calorieGoal: nextGoals.calories,
        proteinGoal: nextGoals.protein,
        carbsGoal: nextGoals.carbs,
        fatGoal: nextGoals.fat,
      });
    }
  };

  const handleUpdateReminders = async (nextSettings: MealReminderSettings) => {
    setReminders(nextSettings);
    saveLocalReminders(nextSettings);
    if (user) {
      await updateUserProfilePatch(user.uid, {
        remindersEnabled: nextSettings.enabled,
        breakfastTime: nextSettings.breakfastTime,
        lunchTime: nextSettings.lunchTime,
        dinnerTime: nextSettings.dinnerTime,
      });
    }
  };

  const handleSendTestReminder = async () => {
    const perm = await requestNotificationPermission();
    playTimerChime();
    await sendKitchenNotification(
      'Kusina & Co. Meal Reminder',
      'Your kitchen reminders and cooking timer alerts are active.',
      'test-reminder'
    );
    showToast(
      perm === 'granted'
        ? 'Notification alert sent!'
        : 'Chime played (allow browser notifications for OS alerts)'
    );
  };

  const mergeIngredientsIntoGrocery = async (
    entries: { recipe: Recipe; servings: number }[]
  ) => {
    const byKey = new Map<string, GroceryItem>();
    groceryItems.forEach((item) => {
      const key = `${item.name.toLowerCase()}__${item.unit.toLowerCase()}`;
      byKey.set(key, { ...item });
    });

    const newlyAddedOrUpdated: GroceryItem[] = [];

    entries.forEach(({ recipe, servings }) => {
      const scale = servings / recipe.baseServings;
      recipe.ingredients.forEach((ing) => {
        const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}`;
        const scaledAmt = Number((ing.amount * scale).toFixed(1));
        const existing = byKey.get(key);
        if (existing) {
          existing.amount = Number((existing.amount + scaledAmt).toFixed(1));
          existing.checked = false;
          if (!existing.sourceRecipeTitle.includes(recipe.title)) {
            existing.sourceRecipeTitle = `${existing.sourceRecipeTitle}, ${recipe.title}`.slice(
              0,
              120
            );
          }
          byKey.set(key, existing);
          newlyAddedOrUpdated.push(existing);
        } else {
          const id = `ing_${ing.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}_${Date.now().toString(36)}`;
          const created: GroceryItem = {
            id,
            name: ing.name,
            amount: scaledAmt,
            unit: ing.unit,
            aisle: ing.aisle,
            checked: false,
            sourceRecipeTitle: recipe.title,
          };
          byKey.set(key, created);
          newlyAddedOrUpdated.push(created);
        }
      });
    });

    const nextList = Array.from(byKey.values());
    setGroceryItems(nextList);
    saveLocalGroceryItems(nextList);

    if (user) {
      await Promise.all(
        newlyAddedOrUpdated.map((item) => upsertGroceryItemCloud(user.uid, item))
      );
    }
  };

  const handleAddRecipeToGrocery = async (recipe: Recipe, servings: number) => {
    await mergeIngredientsIntoGrocery([{ recipe, servings }]);
    showToast(`Added ${recipe.ingredients.length} ingredients to Grocery List`);
  };

  const handleGenerateWeeklyGrocery = async () => {
    const entries = mealPlans
      .map((m) => {
        const recipe = RECIPES.find((r) => r.id === m.recipeId);
        return recipe ? { recipe, servings: m.servings } : null;
      })
      .filter((x): x is { recipe: Recipe; servings: number } => x !== null);

    if (entries.length === 0) {
      showToast('Plan at least one meal first');
      return;
    }
    await mergeIngredientsIntoGrocery(entries);
    setActiveTab('grocery');
    showToast(`Generated grocery list from ${entries.length} planned meals`);
  };

  const handleToggleGrocery = async (id: string) => {
    let nextChecked = false;
    const next = groceryItems.map((item) => {
      if (item.id === id) {
        nextChecked = !item.checked;
        return { ...item, checked: nextChecked };
      }
      return item;
    });
    setGroceryItems(next);
    saveLocalGroceryItems(next);
    if (user) {
      await toggleGroceryItemCloud(user.uid, id, nextChecked);
    }
  };

  const handleDeleteGrocery = async (id: string) => {
    const next = groceryItems.filter((item) => item.id !== id);
    setGroceryItems(next);
    saveLocalGroceryItems(next);
    if (user) {
      await deleteGroceryItemCloud(user.uid, id);
    }
  };

  const handleAddCustomGrocery = async (
    name: string,
    amount: number,
    unit: string,
    aisle: AisleCategory
  ) => {
    const newItem: GroceryItem = {
      id: `custom_${Date.now().toString(36)}`,
      name,
      amount,
      unit,
      aisle,
      checked: false,
      sourceRecipeTitle: 'Custom item',
    };
    const next = [newItem, ...groceryItems];
    setGroceryItems(next);
    saveLocalGroceryItems(next);
    if (user) {
      await upsertGroceryItemCloud(user.uid, newItem);
    }
  };

  const handleClearCheckedGrocery = async () => {
    const toRemove = groceryItems.filter((i) => i.checked);
    const remaining = groceryItems.filter((i) => !i.checked);
    setGroceryItems(remaining);
    saveLocalGroceryItems(remaining);
    if (user) {
      await Promise.all(toRemove.map((i) => deleteGroceryItemCloud(user.uid, i.id)));
    }
    showToast(`Cleared ${toRemove.length} checked items`);
  };

  // Timer controls
  const handleStartTimer = async (
    label: string,
    recipeTitle: string,
    durationSeconds: number
  ) => {
    await requestNotificationPermission().catch(() => undefined);
    const id = `timer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    setTimers((prev) => [
      ...prev,
      {
        id,
        label,
        recipeTitle,
        totalSeconds: durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: true,
        completed: false,
      },
    ]);
    showToast(`Started ${Math.round(durationSeconds / 60)}m timer: ${label}`);
  };

  const handleToggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const handleAddMinute = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, remainingSeconds: t.remainingSeconds + 60 } : t
      )
    );
  };

  const handleDismissTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'recipes', label: 'Recipes', icon: <Utensils className="w-5 h-5" /> },
    { id: 'planner', label: 'Planner', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'grocery', label: 'Grocery', icon: <ShoppingBasket className="w-5 h-5" /> },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Sticky Top Navigation Bar (Strict 3-Zone Contract on Desktop, Compact 52px on Mobile) */}
      <header className="sticky top-0 z-30 h-[52px] md:h-16 bg-[var(--surface)]/92 backdrop-blur-md border-b border-[var(--border-hairline)]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark Only */}
          <button
            type="button"
            onClick={() => setActiveTab('recipes')}
            className="font-display text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kusina &amp; Co.
          </button>

          {/* Zone 2: Clean Single-Line Nav Links (Desktop) */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
                    active
                      ? 'text-[var(--foreground)] border-[var(--accent)]'
                      : 'text-[var(--muted)] border-transparent hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className="inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--background)] text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer hover:bg-[var(--surface-muted)]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="max-w-[110px] truncate">
                  {user.displayName?.split(' ')[0] || 'Synced'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'recipes' && (
          <RecipesView
            recipes={RECIPES}
            offlineIds={offlineIds}
            onSelectRecipe={setSelectedRecipe}
            onToggleOfflineSave={handleToggleOfflineSave}
            onShareRecipe={(r) => setShareSession({ recipe: r, servings: r.baseServings })}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerView
            recipes={RECIPES}
            weekDates={weekDates}
            mealPlans={mealPlans}
            goals={goals}
            reminders={reminders}
            onAssignMeal={handleAssignMeal}
            onRemoveMeal={handleRemoveMeal}
            onUpdateGoals={handleUpdateGoals}
            onUpdateReminders={handleUpdateReminders}
            onGenerateWeeklyGrocery={handleGenerateWeeklyGrocery}
            onSelectRecipe={setSelectedRecipe}
            onSendTestReminder={handleSendTestReminder}
          />
        )}

        {activeTab === 'grocery' && (
          <GroceryView
            items={groceryItems}
            onToggleItem={handleToggleGrocery}
            onDeleteItem={handleDeleteGrocery}
            onAddCustomItem={handleAddCustomGrocery}
            onClearChecked={handleClearCheckedGrocery}
            onGenerateFromPlan={handleGenerateWeeklyGrocery}
          />
        )}

        {activeTab === 'saved' && (
          <SavedView
            user={user}
            recipes={RECIPES}
            offlineIds={offlineIds}
            theme={theme}
            isOnline={isOnline}
            onToggleTheme={handleToggleTheme}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onSelectRecipe={setSelectedRecipe}
            onRemoveOffline={handleToggleOfflineSave}
            onCacheAllOffline={handleCacheAllOffline}
            onStartCustomTimer={(label, mins) =>
              handleStartTimer(label, 'Custom Timer', mins * 60)
            }
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (64px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 pb-safe bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border-hairline)] grid grid-cols-4 items-center"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
              }`}
            >
              {item.icon}
              <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Overlays & Global Feedback */}
      <ActiveTimersBar
        timers={timers}
        onToggleTimer={handleToggleTimer}
        onAddMinute={handleAddMinute}
        onDismissTimer={handleDismissTimer}
      />

      <OfflineIndicator />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 sm:top-20 right-4 z-50 rounded-xl bg-[var(--foreground)] text-[var(--background)] px-4 py-2.5 text-xs font-medium shadow-lg max-w-xs"
        >
          {toast}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailSheet
          recipe={selectedRecipe}
          isOfflineSaved={offlineIds.has(selectedRecipe.id)}
          personalNote={savedMeta[selectedRecipe.id]?.personalNote || ''}
          availableDates={weekDates.map((d) => ({ iso: d.iso, label: d.fullLabel }))}
          onClose={() => setSelectedRecipe(null)}
          onToggleOfflineSave={handleToggleOfflineSave}
          onSaveNote={handleSaveNote}
          onAddIngredientsToGrocery={handleAddRecipeToGrocery}
          onAddToMealPlan={handleAssignMeal}
          onStartCookMode={(r, s) => {
            setSelectedRecipe(null);
            setCookSession({ recipe: r, servings: s });
          }}
          onOpenShare={(r, s) => setShareSession({ recipe: r, servings: s })}
        />
      )}

      {cookSession && (
        <CookModeModal
          recipe={cookSession.recipe}
          servings={cookSession.servings}
          activeTimers={timers}
          onStartTimer={handleStartTimer}
          onClose={() => setCookSession(null)}
        />
      )}

      {shareSession && (
        <ShareSheet
          recipe={shareSession.recipe}
          servings={shareSession.servings}
          onClose={() => setShareSession(null)}
          onToast={showToast}
        />
      )}
    </div>
  );
}
