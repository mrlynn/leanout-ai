import mongoose, { Schema, Document } from "mongoose";

export interface IExercise {
  name: string;
  category: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
  isWarmup: boolean;
}

export interface IWorkoutDay {
  dayIndex: number;
  dayName: string;
  isRest: boolean;
  focus: string;
  workoutName: string;
  estimatedMinutes: number;
  exercises: IExercise[];
}

export interface IWorkoutPlan extends Document {
  userId: mongoose.Types.ObjectId;
  goal: string;
  preferences: {
    equipment: string;
    workoutsPerWeek: number;
    durationMinutes: number;
    experienceLevel: string;
    split: string;
    warmupSets: boolean;
    circuits: boolean;
  };
  schedule: IWorkoutDay[];
  startDay: number; // 0=Mon … 6=Sun
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema({
  name: String,
  category: String,
  sets: Number,
  reps: String,
  rest: String,
  notes: String,
  isWarmup: { type: Boolean, default: false },
});

const WorkoutDaySchema = new Schema({
  dayIndex: Number,
  dayName: String,
  isRest: Boolean,
  focus: String,
  workoutName: String,
  estimatedMinutes: Number,
  exercises: [ExerciseSchema],
});

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    goal: { type: String, required: true },
    preferences: {
      equipment: String,
      workoutsPerWeek: Number,
      durationMinutes: Number,
      experienceLevel: String,
      split: String,
      warmupSets: Boolean,
      circuits: Boolean,
    },
    schedule: [WorkoutDaySchema],
    startDay: { type: Number, default: 0 }, // 0=Mon … 6=Sun
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.WorkoutPlan ?? mongoose.model<IWorkoutPlan>("WorkoutPlan", WorkoutPlanSchema);
