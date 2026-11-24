import {
  GroceryItem,
  MealPlanEntry,
  MealReminderSettings,
  NutritionGoals,
  Recipe,
  SavedRecipeMeta,
} from '../types/recipe';

const DB_NAME = 'kusina-offline-db';
const DB_VERSION = 1;
const STORE_RECIPES = 'cachedRecipes';
const MEDIA_CACHE_NAME = 'kusina-offline-media-v1';

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_RECIPES)) {
        db.createObjectStore(STORE_RECIPES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheRecipeForOffline(recipe: Recipe): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECIPES, 'readwrite');
      tx.objectStore(STORE_RECIPES).put({
        ...recipe,
        cachedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if ('caches' in window && recipe.imageUrl) {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      await cache.add(recipe.imageUrl).catch(() => undefined);
    }
  } catch (err) {
    console.warn('Offline recipe cache fallback:', err);
  }
}

export async function removeOfflineRecipeCache(recipeId: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECIPES, 'readwrite');
      tx.objectStore(STORE_RECIPES).delete(recipeId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed removing offline cache:', err);
  }
}

export async function getOfflineCachedRecipes(): Promise<Recipe[]> {
  try {
    const db = await openOfflineDB();
    return await new Promise<Recipe[]>((resolve, reject) => {
      const tx = db.transaction(STORE_RECIPES, 'readonly');
      const req = tx.objectStore(STORE_RECIPES).getAll();
      req.onsuccess = () => resolve((req.result as Recipe[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// Local-first draft storage (mirrors across sessions & syncs on Google login)
const KEYS = {
  SAVED_META: 'kusina_saved_meta_v1',
  MEAL_PLANS: 'kusina_meal_plans_v1',
  GROCERY_ITEMS: 'kusina_grocery_items_v1',
  NUTRITION_GOALS: 'kusina_nutrition_goals_v1',
  REMINDERS: 'kusina_reminders_v1',
  THEME: 'kusina_theme_v1',
};

export function loadLocalSavedMeta(): Record<string, SavedRecipeMeta> {
  try {
    const raw = localStorage.getItem(KEYS.SAVED_META);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalSavedMeta(data: Record<string, SavedRecipeMeta>): void {
  try {
    localStorage.setItem(KEYS.SAVED_META, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export function loadLocalMealPlans(todayIso: string): MealPlanEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.MEAL_PLANS);
    if (raw) {
      return JSON.parse(raw);
    }
    // Helpful starter day for first-time guests
    return [
      {
        id: `${todayIso}_lunch`,
        date: todayIso,
        slot: 'lunch',
        recipeId: 'intl-herb-salmon-avocado',
        servings: 1,
      },
      {
        id: `${todayIso}_dinner`,
        date: todayIso,
        slot: 'dinner',
        recipeId: 'filipino-chicken-adobo',
        servings: 1,
      },
    ];
  } catch {
    return [];
  }
}

export function saveLocalMealPlans(plans: MealPlanEntry[]): void {
  try {
    localStorage.setItem(KEYS.MEAL_PLANS, JSON.stringify(plans));
  } catch {
    // ignore
  }
}

export function loadLocalGroceryItems(): GroceryItem[] {
  try {
    const raw = localStorage.getItem(KEYS.GROCERY_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalGroceryItems(items: GroceryItem[]): void {
  try {
    localStorage.setItem(KEYS.GROCERY_ITEMS, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 130,
  carbs: 180,
  fat: 75,
};

export function loadLocalNutritionGoals(): NutritionGoals {
  try {
    const raw = localStorage.getItem(KEYS.NUTRITION_GOALS);
    return raw ? { ...DEFAULT_NUTRITION_GOALS, ...JSON.parse(raw) } : DEFAULT_NUTRITION_GOALS;
  } catch {
    return DEFAULT_NUTRITION_GOALS;
  }
}

export function saveLocalNutritionGoals(goals: NutritionGoals): void {
  try {
    localStorage.setItem(KEYS.NUTRITION_GOALS, JSON.stringify(goals));
  } catch {
    // ignore
  }
}

export const DEFAULT_REMINDERS: MealReminderSettings = {
  enabled: false,
  breakfastTime: '08:00',
  lunchTime: '12:30',
  dinnerTime: '18:30',
};

export function loadLocalReminders(): MealReminderSettings {
  try {
    const raw = localStorage.getItem(KEYS.REMINDERS);
    return raw ? { ...DEFAULT_REMINDERS, ...JSON.parse(raw) } : DEFAULT_REMINDERS;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export function saveLocalReminders(settings: MealReminderSettings): void {
  try {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadLocalTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(KEYS.THEME);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveLocalTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(KEYS.THEME, theme);
  } catch {
    // ignore
  }
}
