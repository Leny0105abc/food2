import { type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  GroceryItem,
  MealPlanEntry,
  MealReminderSettings,
  NutritionGoals,
  SavedRecipeMeta,
  UserProfileData,
} from '../types/recipe';
import { db, handleFirestoreError, OperationType } from './firebase';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return cleaned || 'item_1';
}

export async function ensureUserProfile(
  user: User,
  defaults: {
    goals: NutritionGoals;
    reminders: MealReminderSettings;
    theme: 'light' | 'dark';
  }
): Promise<boolean> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName: (user.displayName || 'Home Cook').slice(0, 100),
        email: (user.email || 'user@example.com').slice(0, 200),
        calorieGoal: Math.min(8000, Math.max(800, Math.round(defaults.goals.calories))),
        proteinGoal: Math.min(500, Math.max(20, Math.round(defaults.goals.protein))),
        carbsGoal: Math.min(800, Math.max(10, Math.round(defaults.goals.carbs))),
        fatGoal: Math.min(400, Math.max(10, Math.round(defaults.goals.fat))),
        dietaryDefaults: [],
        theme: defaults.theme,
        remindersEnabled: defaults.reminders.enabled,
        breakfastTime: defaults.reminders.breakfastTime,
        lunchTime: defaults.reminders.lunchTime,
        dinnerTime: defaults.reminders.dinnerTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfilePatch(
  uid: string,
  patch: Partial<Omit<UserProfileData, 'uid' | 'email'>>
): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  try {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.displayName !== undefined) payload.displayName = patch.displayName.slice(0, 100);
    if (patch.calorieGoal !== undefined)
      payload.calorieGoal = Math.min(8000, Math.max(800, Math.round(patch.calorieGoal)));
    if (patch.proteinGoal !== undefined)
      payload.proteinGoal = Math.min(500, Math.max(20, Math.round(patch.proteinGoal)));
    if (patch.carbsGoal !== undefined)
      payload.carbsGoal = Math.min(800, Math.max(10, Math.round(patch.carbsGoal)));
    if (patch.fatGoal !== undefined)
      payload.fatGoal = Math.min(400, Math.max(10, Math.round(patch.fatGoal)));
    if (patch.dietaryDefaults !== undefined)
      payload.dietaryDefaults = patch.dietaryDefaults.slice(0, 8);
    if (patch.theme !== undefined) payload.theme = patch.theme;
    if (patch.remindersEnabled !== undefined) payload.remindersEnabled = patch.remindersEnabled;
    if (patch.breakfastTime !== undefined) payload.breakfastTime = patch.breakfastTime;
    if (patch.lunchTime !== undefined) payload.lunchTime = patch.lunchTime;
    if (patch.dinnerTime !== undefined) payload.dinnerTime = patch.dinnerTime;

    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertSavedRecipeCloud(
  uid: string,
  meta: SavedRecipeMeta
): Promise<void> {
  const recipeId = sanitizeId(meta.recipeId);
  const path = `users/${uid}/savedRecipes/${recipeId}`;
  const ref = doc(db, 'users', uid, 'savedRecipes', recipeId);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        offlinePinned: Boolean(meta.offlinePinned),
        personalNote: (meta.personalNote || '').slice(0, 600),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        recipeId,
        offlinePinned: Boolean(meta.offlinePinned),
        personalNote: (meta.personalNote || '').slice(0, 600),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertMealPlanCloud(
  uid: string,
  entry: MealPlanEntry
): Promise<void> {
  const planId = sanitizeId(entry.id);
  const path = `users/${uid}/mealPlans/${planId}`;
  const ref = doc(db, 'users', uid, 'mealPlans', planId);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        recipeId: sanitizeId(entry.recipeId),
        servings: Math.min(20, Math.max(1, Math.round(entry.servings))),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        date: entry.date,
        slot: entry.slot,
        recipeId: sanitizeId(entry.recipeId),
        servings: Math.min(20, Math.max(1, Math.round(entry.servings))),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMealPlanCloud(uid: string, planId: string): Promise<void> {
  const safeId = sanitizeId(planId);
  const path = `users/${uid}/mealPlans/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mealPlans', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertGroceryItemCloud(
  uid: string,
  item: GroceryItem
): Promise<void> {
  const itemId = sanitizeId(item.id);
  const path = `users/${uid}/groceryItems/${itemId}`;
  const ref = doc(db, 'users', uid, 'groceryItems', itemId);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        amount: Math.min(10000, Math.max(0, Number(item.amount) || 0)),
        unit: (item.unit || '').slice(0, 32),
        checked: Boolean(item.checked),
        sourceRecipeTitle: (item.sourceRecipeTitle || '').slice(0, 120),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        name: (item.name || 'Item').slice(0, 120),
        amount: Math.min(10000, Math.max(0, Number(item.amount) || 0)),
        unit: (item.unit || '').slice(0, 32),
        aisle: item.aisle,
        checked: Boolean(item.checked),
        sourceRecipeTitle: (item.sourceRecipeTitle || '').slice(0, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleGroceryItemCloud(
  uid: string,
  itemId: string,
  checked: boolean
): Promise<void> {
  const safeId = sanitizeId(itemId);
  const path = `users/${uid}/groceryItems/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'groceryItems', safeId), {
      checked,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteGroceryItemCloud(uid: string, itemId: string): Promise<void> {
  const safeId = sanitizeId(itemId);
  const path = `users/${uid}/groceryItems/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'groceryItems', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserCloudData(
  uid: string,
  callbacks: {
    onProfile: (profile: UserProfileData) => void;
    onSavedRecipes: (saved: Record<string, SavedRecipeMeta>) => void;
    onMealPlans: (plans: MealPlanEntry[]) => void;
    onGroceryItems: (items: GroceryItem[]) => void;
  }
): Unsubscribe {
  const unsubProfile = onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        callbacks.onProfile({
          uid: d.uid,
          displayName: d.displayName,
          email: d.email,
          calorieGoal: d.calorieGoal,
          proteinGoal: d.proteinGoal,
          carbsGoal: d.carbsGoal,
          fatGoal: d.fatGoal,
          dietaryDefaults: d.dietaryDefaults || [],
          theme: d.theme || 'light',
          remindersEnabled: Boolean(d.remindersEnabled),
          breakfastTime: d.breakfastTime || '08:00',
          lunchTime: d.lunchTime || '12:30',
          dinnerTime: d.dinnerTime || '18:30',
        });
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
  );

  const savedPath = `users/${uid}/savedRecipes`;
  const unsubSaved = onSnapshot(
    query(collection(db, 'users', uid, 'savedRecipes'), where('ownerId', '==', uid)),
    (snap) => {
      const map: Record<string, SavedRecipeMeta> = {};
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        map[d.recipeId] = {
          recipeId: d.recipeId,
          offlinePinned: Boolean(d.offlinePinned),
          personalNote: d.personalNote || '',
        };
      });
      callbacks.onSavedRecipes(map);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, savedPath)
  );

  const plansPath = `users/${uid}/mealPlans`;
  const unsubPlans = onSnapshot(
    query(collection(db, 'users', uid, 'mealPlans'), where('ownerId', '==', uid)),
    (snap) => {
      const list: MealPlanEntry[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          date: d.date,
          slot: d.slot,
          recipeId: d.recipeId,
          servings: d.servings,
        });
      });
      callbacks.onMealPlans(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, plansPath)
  );

  const groceryPath = `users/${uid}/groceryItems`;
  const unsubGrocery = onSnapshot(
    query(collection(db, 'users', uid, 'groceryItems'), where('ownerId', '==', uid)),
    (snap) => {
      const list: GroceryItem[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          name: d.name,
          amount: d.amount,
          unit: d.unit,
          aisle: d.aisle,
          checked: Boolean(d.checked),
          sourceRecipeTitle: d.sourceRecipeTitle || 'Custom',
        });
      });
      callbacks.onGroceryItems(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, groceryPath)
  );

  return () => {
    unsubProfile();
    unsubSaved();
    unsubPlans();
    unsubGrocery();
  };
}
