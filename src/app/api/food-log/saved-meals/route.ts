import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import SavedMeal from "@/models/SavedMeal";
import FoodLogEntry from "@/models/FoodLogEntry";
import { aggregateDayTotals, getDateString, validateFoods } from "@/lib/foodLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const meals = await SavedMeal.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(30).lean();
  return NextResponse.json({ meals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, name, mealType, foods, entryId, sourceDate, targetDate } = await req.json();
  await connectDB();

  if (action === "save") {
    if (!name || !mealType || !validateFoods(foods)) {
      return NextResponse.json({ error: "Invalid save payload" }, { status: 400 });
    }
    const meal = await SavedMeal.create({ userId: session.user.id, name, mealType, foods });
    return NextResponse.json({ meal });
  }

  if (action === "copy_day") {
    const from = sourceDate ?? getDateString(new Date(Date.now() - 86400000));
    const to = targetDate ?? getDateString();
    const entries = await FoodLogEntry.find({ userId: session.user.id, date: from }).lean();
    if (entries.length === 0) return NextResponse.json({ error: "No entries on source date" }, { status: 404 });

    const created = [];
    for (const e of entries) {
      const entry = await FoodLogEntry.create({
        userId: session.user.id,
        date: to,
        mealType: e.mealType,
        source: "manual",
        foods: e.foods,
        notes: e.notes ? `Copied from ${from}` : undefined,
      });
      created.push(entry);
    }
    const totals = aggregateDayTotals(await FoodLogEntry.find({ userId: session.user.id, date: to }).lean());
    return NextResponse.json({ copied: created.length, totals });
  }

  if (action === "log_saved") {
    const meal = await SavedMeal.findOne({ _id: entryId, userId: session.user.id });
    if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    const date = targetDate ?? getDateString();
    const entry = await FoodLogEntry.create({
      userId: session.user.id,
      date,
      mealType: meal.mealType,
      source: "manual",
      foods: meal.foods,
      notes: meal.name,
    });
    const totals = aggregateDayTotals(await FoodLogEntry.find({ userId: session.user.id, date }).lean());
    return NextResponse.json({ entry, totals });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await connectDB();
  await SavedMeal.deleteOne({ _id: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
