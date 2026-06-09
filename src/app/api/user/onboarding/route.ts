import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const ONBOARDING_FIELDS = [
  "age",
  "sex",
  "heightInches",
  "weightLbs",
  "bodyFatPercent",
  "activityLevel",
  "trainingFrequency",
  "goalType",
  "goalBodyFatPercent",
  "goalDate",
  "vacationDate",
  "foodPreferences",
  "allergies",
  "supplements",
  "onTRT",
] as const;

type OnboardingField = (typeof ONBOARDING_FIELDS)[number];

function pickOnboardingFields(data: Record<string, unknown>): Partial<Record<OnboardingField, unknown>> {
  const unknown = Object.keys(data).filter(
    (k) => !ONBOARDING_FIELDS.includes(k as OnboardingField)
  );
  if (unknown.length > 0) {
    throw new Error(`Unknown fields: ${unknown.join(", ")}`);
  }

  const update: Partial<Record<OnboardingField, unknown>> = {};
  for (const key of ONBOARDING_FIELDS) {
    if (key in data) update[key] = data[key];
  }
  return update;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const fields = pickOnboardingFields(data);

    await connectDB();

    await User.findByIdAndUpdate(
      session.user.id,
      {
        ...fields,
        onboardingComplete: true,
        startingWeightLbs: fields.weightLbs,
      },
      { runValidators: true }
    );

    return NextResponse.json({ message: "Onboarding complete" });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unknown fields:")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
