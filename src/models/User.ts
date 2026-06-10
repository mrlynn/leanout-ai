import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  oauthProvider?: "google" | "apple";
  passwordResetHash?: string;
  passwordResetExpires?: Date;
  pushTokens?: string[];
  healthSyncEnabled?: boolean;
  lastHealthSyncAt?: Date;
  // Onboarding fields
  age?: number;
  sex?: "male" | "female";
  heightInches?: number;
  weightLbs?: number;
  bodyFatPercent?: number;
  activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";
  trainingFrequency?: number;
  goalType?: "lose_fat" | "maintain" | "build_muscle";
  goalBodyFatPercent?: number;
  goalDate?: Date;
  vacationDate?: Date;
  // Notifications
  timezone?: string;
  reminderHour?: number;
  remindersEnabled?: boolean;
  foodPreferences?: string;
  allergies?: string;
  supplements?: string;
  onTRT?: boolean;
  onboardingComplete?: boolean;
  // Gamification
  xp?: number;
  xpSpendable?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastCheckInDate?: Date;
  earnedBadges?: string[];
  startingWeightLbs?: number;
  streakFreezes?: number;
  lastFreezeGrantMonth?: string;
  // Subscription
  planTier?: "free" | "pro";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | null;
  currentPeriodEnd?: Date;
  // Macro adjustment (Pro)
  suggestedCalories?: number;
  suggestedProteinG?: number;
  suggestedCarbsG?: number;
  suggestedFatG?: number;
  macroSuggestionAt?: Date;
  macroOverrideCalories?: number;
  macroOverrideProteinG?: number;
  macroOverrideCarbsG?: number;
  macroOverrideFatG?: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    oauthProvider: { type: String, enum: ["google", "apple"] },
    passwordResetHash: String,
    passwordResetExpires: Date,
    pushTokens: { type: [String], default: [] },
    healthSyncEnabled: { type: Boolean, default: false },
    lastHealthSyncAt: Date,
    age: Number,
    sex: { type: String, enum: ["male", "female"] },
    heightInches: Number,
    weightLbs: Number,
    bodyFatPercent: Number,
    activityLevel: {
      type: String,
      enum: ["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"],
    },
    trainingFrequency: Number,
    goalType: { type: String, enum: ["lose_fat", "maintain", "build_muscle"] },
    goalBodyFatPercent: Number,
    goalDate: Date,
    vacationDate: Date,
    timezone: { type: String, default: "America/New_York" },
    reminderHour: { type: Number, default: 20 },
    remindersEnabled: { type: Boolean, default: true },
    foodPreferences: String,
    allergies: String,
    supplements: String,
    onTRT: Boolean,
    onboardingComplete: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    xpSpendable: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCheckInDate: Date,
    earnedBadges: { type: [String], default: [] },
    startingWeightLbs: Number,
    streakFreezes: { type: Number, default: 0, min: 0, max: 2 },
    lastFreezeGrantMonth: String,
    planTier: { type: String, enum: ["free", "pro"], default: "free" },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled", "incomplete", null],
      default: null,
    },
    currentPeriodEnd: Date,
    suggestedCalories: Number,
    suggestedProteinG: Number,
    suggestedCarbsG: Number,
    suggestedFatG: Number,
    macroSuggestionAt: Date,
    macroOverrideCalories: Number,
    macroOverrideProteinG: Number,
    macroOverrideCarbsG: Number,
    macroOverrideFatG: Number,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
