import { Exercise } from "./data";

export interface UserStats {
  userId: string;
  email: string;
  displayName: string;
  streak: number;
  totalWorkouts: number;
  lastCompletedDate?: string | null;
}

export interface LoggedSet {
  setIndex: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  logId: string;
  userId: string;
  workoutName: string;
  dayIndex: number;
  completedAt: string; // ISO date-time
  duration: number; // in seconds
  exercises: LoggedExercise[];
}
