import mongoose, { Schema, Document } from "mongoose";

export interface ISetLog {
  setNumber: number;
  weightLbs?: number;
  reps?: number;
  rpe?: number;
  completed: boolean;
}

export interface IExerciseLog {
  name: string;
  sets: ISetLog[];
}

export interface IWorkoutSession extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  workoutName: string;
  focus: string;
  exercises: IExerciseLog[];
  durationMinutes?: number;
  completedAt?: Date;
  createdAt: Date;
}

const SetLogSchema = new Schema<ISetLog>(
  {
    setNumber: Number,
    weightLbs: Number,
    reps: Number,
    rpe: { type: Number, min: 1, max: 10 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExerciseLogSchema = new Schema<IExerciseLog>(
  {
    name: String,
    sets: [SetLogSchema],
  },
  { _id: false }
);

const WorkoutSessionSchema = new Schema<IWorkoutSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    workoutName: String,
    focus: String,
    exercises: [ExerciseLogSchema],
    durationMinutes: Number,
    completedAt: Date,
  },
  { timestamps: true }
);

WorkoutSessionSchema.index({ userId: 1, date: -1 });

export default mongoose.models.WorkoutSession ??
  mongoose.model<IWorkoutSession>("WorkoutSession", WorkoutSessionSchema);
