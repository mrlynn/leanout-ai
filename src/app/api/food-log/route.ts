import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FoodLogEntry from "@/models/FoodLogEntry";
import mongoose from "mongoose";
import {
  aggregateDayTotals,
  getDateString,
  isValidMealType,
  isValidSource,
  validateFoods,
} from "@/lib/foodLog";

async function getEntriesForDate(userId: string, date: string) {
  return FoodLogEntry.find({ userId, date }).sort({ createdAt: 1 }).lean();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? getDateString();

  await connectDB();
  const entries = await getEntriesForDate(session.user.id, date);
  const totals = aggregateDayTotals(entries);

  return NextResponse.json({ entries, totals, date });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, mealType, source, foods, notes } = body;

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!isValidMealType(mealType)) {
    return NextResponse.json({ error: "Invalid mealType" }, { status: 400 });
  }
  if (!isValidSource(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }
  if (!validateFoods(foods)) {
    return NextResponse.json({ error: "Invalid foods array" }, { status: 400 });
  }

  await connectDB();
  const entry = await FoodLogEntry.create({
    userId: session.user.id,
    date,
    mealType,
    source,
    foods,
    notes: notes ?? undefined,
  });

  const entries = await getEntriesForDate(session.user.id, date);
  const totals = aggregateDayTotals(entries);

  return NextResponse.json({ entry, totals });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, mealType, foods, notes } = await req.json();
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (mealType !== undefined) {
    if (!isValidMealType(mealType)) {
      return NextResponse.json({ error: "Invalid mealType" }, { status: 400 });
    }
    update.mealType = mealType;
  }
  if (foods !== undefined) {
    if (!validateFoods(foods)) {
      return NextResponse.json({ error: "Invalid foods array" }, { status: 400 });
    }
    update.foods = foods;
  }
  if (notes !== undefined) update.notes = notes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await connectDB();
  const entry = await FoodLogEntry.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: update },
    { new: true }
  );

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await getEntriesForDate(session.user.id, entry.date);
  const totals = aggregateDayTotals(entries);

  return NextResponse.json({ entry, totals });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const entry = await FoodLogEntry.findOneAndDelete({ _id: id, userId: session.user.id });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await getEntriesForDate(session.user.id, entry.date);
  const totals = aggregateDayTotals(entries);

  return NextResponse.json({ deleted: true, totals, date: entry.date });
}
