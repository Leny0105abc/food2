export type Cuisine = 'Filipino' | 'Chinese' | 'Italian' | 'International';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Chef';

export type DietaryTag =
  | 'Keto'
  | 'Gluten-Free'
  | 'Dairy-Free'
  | 'Vegetarian'
  | 'Halal-Friendly'
  | 'Low-Carb';

export type AisleCategory =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Pantry & Sauces'
  | 'Dairy & Eggs'
  | 'Herbs & Spices'
  | 'Bakery & Grains';

export type TechniqueAnimation =
  | 'sear'
  | 'simmer'
  | 'steam'
  | 'chop'
  | 'whisk'
  | 'toss'
  | 'plate';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: AisleCategory;
  note?: string;
}

export interface RecipeStep {
  stepNumber: number;
  title: string;
  instruction: string;
  techniqueAnimation: TechniqueAnimation;
  durationSeconds: number;
  timerLabel?: string;
  visualCue: string;
  proTip: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  cuisine: Cuisine;
  skillLevel: SkillLevel;
  prepMinutes: number;
  cookMinutes: number;
  baseServings: number;
  imageUrl: string;
  dietaryTags: DietaryTag[];
  nutritionPerServing: NutritionInfo;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  shareBlurb: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealReminderSettings {
  enabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  dietaryDefaults: DietaryTag[];
  theme: 'light' | 'dark';
  remindersEnabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
}

export interface SavedRecipeMeta {
  recipeId: string;
  offlinePinned: boolean;
  personalNote: string;
}

export interface MealPlanEntry {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  recipeId: string;
  servings: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: AisleCategory;
  checked: boolean;
  sourceRecipeTitle: string;
}

export interface ActiveTimer {
  id: string;
  label: string;
  recipeTitle: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  completed: boolean;
}

export type AppTab = 'recipes' | 'planner' | 'grocery' | 'saved';
