export type ExerciseCategory = 'cardio' | 'strength' | 'yoga' | 'stretching';

export type FitnessLevel = 'beginner' | 'intermediate' | 'expert';

export type Gender = 'male' | 'female' | 'other';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  duration: number;
  difficulty: FitnessLevel;
  caloriesBurn: number;
  instructions: string[];
  targetMuscles: string[];
  imageUrl: string;
  videoUrl: string;
}

export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general_health';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher';

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: Gender;
  fitnessLevel: FitnessLevel;
  photoUri?: string;
  fitnessGoal?: FitnessGoal;
  activityLevel?: ActivityLevel;
  dietaryPreference?: DietaryPreference;
  medicalRestrictions?: string;
  email?: string;
  phoneNumber?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

export type Rank = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface RankInfo {
  rank: Rank;
  minXp: number;
  maxXp: number;
  progress: number;
  xpToNext: number;
}

export interface ActivityDayStats {
  dateKey: string;
  exerciseMinutes: number;
  exercisesCompleted: number;
  caloriesFromExercises: number;
  totalCalories: number;
}

export interface ActivityState {
  today: ActivityDayStats;
  week: ActivityDayStats[];
  month: ActivityDayStats[];
}
