"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  Mic,
  MicOff,
  Pencil,
  Plus,
  ScanBarcode,
  Bookmark,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { FoodLogReview, type ReviewState, type FoodItemWithGrade } from "@/components/FoodLogReview";
import { GradeBadge } from "@/components/ui/GradeBadge";
import type { FoodGrade } from "@/lib/foodGrade";
import { PageContainer } from "@/components/PageContainer";
import { useUpgradeModal, handleLimitReached } from "@/components/UpgradeModal";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import {
  getDateString,
  getDayNameFromStartDate,
  inferMealTypeFromName,
  mealPlanFoodToFoodItem,
  sumFoods,
  type FoodItem,
  type FoodSource,
  type MacroTotals,
  type MealType,
} from "@/lib/foodLog";

interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface FoodLogEntry {
  _id: string;
  date: string;
  mealType: MealType;
  source: FoodSource;
  foods: FoodItem[];
  notes?: string;
  createdAt: string;
}

interface MealPlanFood {
  item: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanMeal {
  name: string;
  foods: MealPlanFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealPlanDay {
  day: string;
  meals: MealPlanMeal[];
}

interface MealPlanData {
  startDate: string;
  days: MealPlanDay[];
}

type Tab = "photo" | "voice" | "scan" | "manual" | "plan" | "recent";

const PREFILL_KEY = "food-log-prefill";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function MacroBar({ actual, target, color }: { actual: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function emptyManualFood(): FoodItem {
  return { name: "", quantity: "1 serving", calories: 0, protein: 0, carbs: 0, fat: 0 };
}

const TAB_IDS: Tab[] = ["photo", "voice", "scan", "manual", "plan", "recent"];

export default function FoodLogPage() {
  const { showUpgrade } = useUpgradeModal();
  const today = getDateString();
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  function shiftDate(days: number) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    const next = getDateString(d);
    if (next <= today) setSelectedDate(next);
  }

  function formatDisplayDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    if (dateStr === today) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === getDateString(yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  const [tab, setTab] = useState<Tab>("manual");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TAB_IDS.includes(t as Tab)) {
      setTab(t as Tab);
    }
  }, []);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [totals, setTotals] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [review, setReview] = useState<ReviewState | null>(null);
  const [confidence, setConfidence] = useState<string>();
  const [aiNotes, setAiNotes] = useState<string>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [manualFood, setManualFood] = useState<FoodItem>(emptyManualFood());
  const [manualMealType, setManualMealType] = useState<MealType>("lunch");
  const [manualDescription, setManualDescription] = useState("");
  const [manualShowMacros, setManualShowMacros] = useState(false);
  const [manualAnalyzing, setManualAnalyzing] = useState(false);

  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealPlanMeal[]>([]);
  const [savedMeals, setSavedMeals] = useState<{ _id: string; name: string; mealType: MealType; foods: FoodItem[] }[]>([]);
  const [copying, setCopying] = useState(false);
  const [recentFoods, setRecentFoods] = useState<(FoodItem & { lastUsed: string; useCount: number; grade?: FoodGrade })[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Voice logging state
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceAnalyzing, setVoiceAnalyzing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceTargetRef = useRef<"voice" | "manual">("voice");
  const [voiceTarget, setVoiceTarget] = useState<"voice" | "manual">("voice");

  // Barcode scanner state
  interface BarcodeProduct {
    barcode: string;
    name: string;
    image: string | null;
    servingLabel: string;
    servingGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    per100g: { calories: number; protein: number; carbs: number; fat: number };
    grade?: FoodGrade;
  }
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<BarcodeProduct | null>(null);
  const [barcodeServings, setBarcodeServings] = useState("1");
  const [barcodeError, setBarcodeError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyMealPlan = useCallback((plan: MealPlanData) => {
    setMealPlan(plan);
    const dayName = getDayNameFromStartDate(plan.startDate);
    const day = plan.days.find((d: MealPlanDay) => d.day === dayName);
    setTodayMeals(day?.meals ?? []);
  }, []);

  const loadStaticData = useCallback(async () => {
    try {
      const [contextRes, planRes] = await Promise.all([
        fetch("/api/user/context"),
        fetch("/api/meal-plan"),
      ]);

      if (contextRes.ok) {
        const { macros: m } = await contextRes.json();
        if (m) {
          setMacros({
            calories: m.calories,
            proteinG: m.proteinG,
            carbsG: m.carbsG,
            fatG: m.fatG,
          });
        }
      }

      if (planRes.ok) {
        const { mealPlan: plan } = await planRes.json();
        if (plan?.days) applyMealPlan(plan);
      }
    } catch {
      setError("Failed to load food log");
    }
  }, [applyMealPlan]);

  const loadFoodLog = useCallback(async (date: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const logRes = await fetch(`/api/food-log?date=${date}`);
      if (logRes.ok) {
        const data = await logRes.json();
        setEntries(data.entries);
        setTotals(data.totals);
      }
    } catch {
      setError("Failed to load food log");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadStaticData(),
      loadFoodLog(selectedDate, false),
      fetch("/api/food-log/saved-meals").then((r) => r.ok ? r.json() : { meals: [] }),
    ]).then(([, , saved]) => {
      if (saved?.meals) setSavedMeals(saved.meals);
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecentFoods() {
    if (recentFoods.length > 0) return; // already loaded
    setRecentLoading(true);
    try {
      const res = await fetch("/api/food-log/recent-foods");
      if (res.ok) {
        const data = await res.json();
        setRecentFoods(data.recentFoods ?? []);
      }
    } finally {
      setRecentLoading(false);
    }
  }

  async function copyYesterday() {
    setCopying(true);
    setError("");
    try {
      const res = await fetch("/api/food-log/saved-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "copy_day", targetDate: selectedDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Copy failed");
      await loadFoodLog(selectedDate, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setCopying(false);
    }
  }

  async function logSavedMeal(mealId: string) {
    setError("");
    const res = await fetch("/api/food-log/saved-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log_saved", entryId: mealId, targetDate: selectedDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to log meal");
      return;
    }
    setTotals(data.totals);
    if (data.entry) setEntries((prev) => [...prev, data.entry]);
  }

  async function saveEntryAsMeal(entry: FoodLogEntry) {
    const name = entry.notes || `${entry.mealType} meal`;
    await fetch("/api/food-log/saved-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", name, mealType: entry.mealType, foods: entry.foods }),
    });
    const res = await fetch("/api/food-log/saved-meals");
    const data = await res.json();
    setSavedMeals(data.meals ?? []);
  }

  useEffect(() => {
    loadFoodLog(selectedDate);
  }, [selectedDate, loadFoodLog]);

  // Stop barcode camera when switching away from scan tab or unmounting
  useEffect(() => {
    if (tab !== "scan") stopBarcodeScanner();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { stopBarcodeScanner(); }; // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PREFILL_KEY);
    try {
      const prefill = JSON.parse(raw) as {
        mealName: string;
        foods: MealPlanFood[];
        source: FoodSource;
      };
      setReview({
        mealType: inferMealTypeFromName(prefill.mealName),
        source: prefill.source,
        foods: prefill.foods.map(mealPlanFoodToFoodItem),
        notes: "",
      });
      setTab("plan");
    } catch {
      /* ignore bad prefill */
    }
  }, []);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setRecognizing(true);
    setError("");
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await fetch("/api/food-log/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleLimitReached(data, showUpgrade)) return;
        throw new Error(data.error ?? "Recognition failed");
      }

      const mealType = (["breakfast", "lunch", "dinner", "snack"].includes(data.mealType)
        ? data.mealType
        : "snack") as MealType;

      setReview({
        mealType,
        source: "vision",
        foods: data.foods as FoodItemWithGrade[],
        notes: "",
      });
      setConfidence(data.confidence);
      setAiNotes(data.notes);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recognition failed");
    } finally {
      setRecognizing(false);
    }
  }

  function startVoiceListening(target: "voice" | "manual" = "voice") {
    const SpeechRecognitionAPI =
      (typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionAPI) {
      setError("Voice input is not supported in this browser. Try Chrome on Android or desktop.");
      return;
    }

    voiceTargetRef.current = target;
    setVoiceTarget(target);
    if (target === "voice") {
      setVoiceTranscript("");
      setVoiceInterim("");
    } else {
      setManualDescription("");
    }
    setError("");

    const sr = new SpeechRecognitionAPI();
    sr.continuous = true;
    sr.interimResults = true;
    sr.lang = "en-US";
    recognitionRef.current = sr;

    sr.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      const text = final.trim();
      if (voiceTargetRef.current === "manual") {
        setManualDescription(text + (interim ? ` ${interim}` : ""));
      } else {
        setVoiceTranscript(text);
        setVoiceInterim(interim);
      }
    };

    sr.onerror = () => {
      setVoiceListening(false);
      setError("Microphone error — check your browser permissions.");
    };

    sr.onend = () => {
      setVoiceListening(false);
      if (voiceTargetRef.current === "voice") setVoiceInterim("");
    };

    sr.start();
    setVoiceListening(true);
  }

  function stopVoiceListening() {
    recognitionRef.current?.stop();
    setVoiceListening(false);
    setVoiceInterim("");
  }

  async function analyzeFoodDescription(
    text: string,
    options: { source: FoodSource; defaultMealType?: MealType; onSuccess?: () => void }
  ) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setError("");
    try {
      const res = await fetch("/api/food-log/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleLimitReached(data, showUpgrade)) return;
        throw new Error(data.error ?? "Analysis failed");
      }

      const inferredMealType = (["breakfast", "lunch", "dinner", "snack"].includes(data.mealType)
        ? data.mealType
        : options.defaultMealType ?? "snack") as MealType;

      setReview({ mealType: inferredMealType, source: options.source, foods: data.foods as FoodItemWithGrade[], notes: "" });
      setConfidence(data.confidence);
      setAiNotes(data.notes);
      setEditingId(null);
      options.onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  }

  async function analyzeVoiceTranscript() {
    setVoiceAnalyzing(true);
    await analyzeFoodDescription(voiceTranscript, {
      source: "voice",
      onSuccess: () => setVoiceTranscript(""),
    });
    setVoiceAnalyzing(false);
  }

  async function analyzeManualDescription() {
    setManualAnalyzing(true);
    await analyzeFoodDescription(manualDescription, {
      source: "manual",
      defaultMealType: manualMealType,
      onSuccess: () => setManualDescription(""),
    });
    setManualAnalyzing(false);
  }

  async function ensureBarcodeDetector() {
    if (typeof window === "undefined") return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).BarcodeDetector) return true;
    // Load polyfill (ZXing-based, works on Safari iOS, Firefox, etc.)
    try {
      const { BarcodeDetector: Polyfill } = await import("barcode-detector/pure");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).BarcodeDetector = Polyfill;
      return true;
    } catch {
      return false;
    }
  }

  async function startBarcodeScanner() {
    setBarcodeError("");
    setBarcodeProduct(null);
    setBarcodeServings("1");

    const supported = await ensureBarcodeDetector();
    if (!supported) {
      setBarcodeError("Barcode scanning is not available on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setBarcodeScanning(true);

      // Wait a tick for the video element to mount
      setTimeout(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              stopBarcodeScanner();
              await lookupBarcode(results[0].rawValue);
            }
          } catch { /* frame not ready */ }
        }, 300);
      }, 100);
    } catch {
      setBarcodeError("Camera access denied. Allow camera permission and try again.");
    }
  }

  function stopBarcodeScanner() {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setBarcodeScanning(false);
  }

  async function lookupBarcode(code: string) {
    setBarcodeError("");
    setBarcodeProduct(null);
    try {
      const res = await fetch(`/api/food-log/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      setBarcodeProduct(data);
      setBarcodeServings("1");
    } catch (err) {
      setBarcodeError(err instanceof Error ? err.message : "Lookup failed");
    }
  }

  async function handleBarcodePhotoScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBarcodeError("");

    const supported = await ensureBarcodeDetector();
    if (!supported) {
      setBarcodeError("Barcode detection is not available on this device.");
      return;
    }

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not load image"));
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"] });
      const results = await detector.detect(img);
      URL.revokeObjectURL(img.src);
      if (results.length === 0) {
        setBarcodeError("No barcode found in that photo. Try again with better lighting.");
        return;
      }
      await lookupBarcode(results[0].rawValue);
    } catch (err) {
      setBarcodeError(err instanceof Error ? err.message : "Scan failed");
    }
  }

  function confirmBarcodeProduct() {
    if (!barcodeProduct) return;
    const servings = Math.max(0.25, parseFloat(barcodeServings) || 1);
    // Scale per100g by (servings × servingGrams / 100)
    const scale = (servings * barcodeProduct.servingGrams) / 100;
    const food: FoodItemWithGrade = {
      name: barcodeProduct.name,
      quantity: `${servings === 1 ? "" : `${servings} × `}${barcodeProduct.servingLabel}`,
      calories: Math.round(barcodeProduct.per100g.calories * scale),
      protein: Math.round(barcodeProduct.per100g.protein * scale),
      carbs: Math.round(barcodeProduct.per100g.carbs * scale),
      fat: Math.round(barcodeProduct.per100g.fat * scale),
      grade: barcodeProduct.grade,
    };
    setReview({ mealType: "snack", source: "manual", foods: [food], notes: "" });
    setConfidence(undefined);
    setAiNotes(undefined);
    setEditingId(null);
    setBarcodeProduct(null);
    setBarcodeServings("1");
  }

  function startManualReview() {
    if (!manualFood.name.trim()) {
      setError("Enter a food name");
      return;
    }
    setReview({
      mealType: manualMealType,
      source: "manual",
      foods: [manualFood],
      notes: "",
    });
    setConfidence(undefined);
    setAiNotes(undefined);
    setEditingId(null);
    setError("");
  }

  function startPlanReview(meal: MealPlanMeal) {
    setReview({
      mealType: inferMealTypeFromName(meal.name),
      source: "meal_plan",
      foods: meal.foods.map(mealPlanFoodToFoodItem),
      notes: "",
    });
    setConfidence(undefined);
    setAiNotes(undefined);
    setEditingId(null);
  }

  function startEdit(entry: FoodLogEntry) {
    setReview({
      mealType: entry.mealType,
      source: entry.source,
      foods: [...entry.foods],
      notes: entry.notes ?? "",
    });
    setEditingId(entry._id);
    setConfidence(undefined);
    setAiNotes(undefined);
  }

  function cancelReview() {
    setReview(null);
    setEditingId(null);
    setConfidence(undefined);
    setAiNotes(undefined);
    setManualFood(emptyManualFood());
    setManualDescription("");
    setManualShowMacros(false);
  }

  async function saveReview() {
    if (!review) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        date: selectedDate,
        mealType: review.mealType,
        source: review.source,
        foods: review.foods,
        notes: review.notes || undefined,
      };

      const res = editingId
        ? await fetch("/api/food-log", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...body }),
          })
        : await fetch("/api/food-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setTotals(data.totals);
      if (data.entry) {
        setEntries((prev) =>
          editingId
            ? prev.map((e) => (e._id === editingId ? data.entry : e))
            : [...prev, data.entry]
        );
      }
      cancelReview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this log entry?")) return;
    setError("");
    try {
      const res = await fetch(`/api/food-log?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setTotals(data.totals);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange pt-10 pb-14 md:pt-12">
        <PageContainer>
          <p className="text-orange-200 text-sm font-medium mb-1">Track intake</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Food Log</h1>

          {/* Date navigator */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>

            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="text-white font-bold text-base">{formatDisplayDate(selectedDate)}</span>
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(today)}
                  className="text-orange-200 text-xs hover:text-white underline underline-offset-2 transition-colors"
                >
                  back to today
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>

          {/* Native date input (tap the date to jump) */}
          <div className="mt-2 flex justify-center">
            <input
              type="date"
              max={today}
              value={selectedDate}
              onChange={(e) => { if (e.target.value <= today) setSelectedDate(e.target.value); }}
              className="text-xs text-orange-200 bg-transparent border-none outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </PageContainer>
      </div>

      <PageContainer className="-mt-8 pb-10 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={copyYesterday} disabled={copying}>
            {copying ? <Loader2 size={14} className="animate-spin" /> : "Copy yesterday"}
          </Button>
          {savedMeals.slice(0, 4).map((m) => (
            <Button key={m._id} variant="outline" size="sm" className="rounded-xl" onClick={() => logSavedMeal(m._id)}>
              {m.name}
            </Button>
          ))}
        </div>

        {/* Daily summary */}
        <div className="bg-white rounded-3xl card-shadow-md p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {isToday ? "Today's intake" : `${formatDisplayDate(selectedDate)}'s intake`}
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold">Calories</span>
                  <span className="text-sm">
                    <span className="font-black text-lg">{totals.calories}</span>
                    {macros && <span className="text-muted-foreground"> / {macros.calories}</span>}
                  </span>
                </div>
                <MacroBar actual={totals.calories} target={macros?.calories ?? 0} color="bg-orange-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Protein", actual: totals.protein, target: macros?.proteinG ?? 0, color: "bg-blue-500", text: "text-blue-600" },
                  { label: "Carbs", actual: totals.carbs, target: macros?.carbsG ?? 0, color: "bg-amber-400", text: "text-amber-600" },
                  { label: "Fat", actual: totals.fat, target: macros?.fatG ?? 0, color: "bg-orange-500", text: "text-orange-600" },
                ].map((m) => (
                  <div key={m.label}>
                    <p className={`text-xs font-bold ${m.text}`}>{m.label}</p>
                    <p className="text-lg font-black">
                      {m.actual}<span className="text-xs font-medium text-muted-foreground">g</span>
                      {macros && <span className="text-xs text-muted-foreground"> / {m.target}g</span>}
                    </p>
                    <MacroBar actual={m.actual} target={m.target} color={m.color} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review overlay */}
        {review ? (
          <FoodLogReview
            state={review}
            onChange={setReview}
            onSave={saveReview}
            onCancel={cancelReview}
            saving={saving}
            confidence={confidence}
            aiNotes={aiNotes}
          />
        ) : (
          <>
            {/* Add food tabs */}
            <div className="bg-white rounded-3xl card-shadow p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add food</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: "photo" as Tab, label: "Photo", icon: Camera },
                  { id: "voice" as Tab, label: "Voice", icon: Mic },
                  { id: "scan" as Tab, label: "Scan", icon: ScanBarcode },
                  { id: "manual" as Tab, label: "Manual", icon: Pencil },
                  { id: "plan" as Tab, label: "Plan", icon: UtensilsCrossed },
                  { id: "recent" as Tab, label: "Recent", icon: Clock },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setTab(id); if (id === "recent") loadRecentFoods(); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      tab === id ? "gradient-orange text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {tab === "photo" && (
                <div className="text-center py-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    type="button"
                    className="gradient-orange text-white border-0 w-full"
                    onClick={() => fileRef.current?.click()}
                    disabled={recognizing}
                  >
                    {recognizing ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Analyzing...</>
                    ) : (
                      <><Camera size={16} className="mr-2" /> Take or upload photo</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">AI estimates macros — review before saving</p>
                </div>
              )}

              {tab === "voice" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Describe what you ate naturally — &quot;I had two eggs and toast with butter for breakfast&quot; — and AI will estimate the macros.
                  </p>

                  {/* Mic button */}
                  <div className="flex flex-col items-center py-4 gap-4">
                    <button
                      type="button"
                      onClick={voiceListening ? stopVoiceListening : () => startVoiceListening("voice")}
                      disabled={voiceAnalyzing}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        voiceListening
                          ? "bg-red-500 text-white animate-pulse scale-110"
                          : "gradient-orange text-white hover:scale-105"
                      }`}
                    >
                      {voiceListening ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {voiceListening ? "Listening… tap to stop" : "Tap to speak"}
                    </p>
                  </div>

                  {/* Live transcript display */}
                  {(voiceTranscript || voiceInterim) && (
                    <div className="bg-muted/40 border border-border rounded-xl p-4 min-h-[80px] text-sm">
                      <span className="text-foreground">{voiceTranscript}</span>
                      <span className="text-muted-foreground italic">{voiceInterim}</span>
                    </div>
                  )}

                  {/* Edit transcript manually */}
                  {voiceTranscript && !voiceListening && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Edit before analyzing</label>
                      <textarea
                        className="w-full border border-border rounded-xl p-3 text-sm bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                        rows={3}
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                      />
                    </div>
                  )}

                  {voiceTranscript && !voiceListening && (
                    <Button
                      type="button"
                      className="w-full gradient-orange text-white border-0"
                      onClick={analyzeVoiceTranscript}
                      disabled={voiceAnalyzing}
                    >
                      {voiceAnalyzing ? (
                        <><Loader2 size={16} className="animate-spin mr-2" /> Analyzing...</>
                      ) : (
                        <><Mic size={16} className="mr-2" /> Analyze with AI</>
                      )}
                    </Button>
                  )}

                  {!voiceTranscript && !voiceListening && (
                    <p className="text-xs text-muted-foreground text-center">
                      Works best in Chrome on desktop or Android. Safari has limited support.
                    </p>
                  )}
                </div>
              )}

              {tab === "scan" && (
                <div className="space-y-4">
                  {/* Hidden file input for photo barcode fallback */}
                  <input
                    ref={barcodeFileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleBarcodePhotoScan}
                  />

                  {!barcodeProduct && (
                    <>
                      {/* Live camera scanner */}
                      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        {barcodeScanning && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            {/* Scan frame overlay */}
                            <div className="w-48 h-32 border-2 border-white/70 rounded-xl relative">
                              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
                              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
                              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                            </div>
                            <p className="text-white text-xs mt-3 font-semibold drop-shadow">Align barcode inside frame</p>
                          </div>
                        )}
                        {!barcodeScanning && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ScanBarcode size={40} className="text-white/30" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!barcodeScanning ? (
                          <Button
                            type="button"
                            className="flex-1 gradient-orange text-white border-0"
                            onClick={startBarcodeScanner}
                          >
                            <ScanBarcode size={16} className="mr-2" /> Start Camera Scan
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={stopBarcodeScanner}
                          >
                            <X size={16} className="mr-2" /> Stop
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => barcodeFileRef.current?.click()}
                          disabled={barcodeScanning}
                        >
                          <Camera size={16} className="mr-2" /> Scan from Photo
                        </Button>
                      </div>

                      {barcodeError && (
                        <p className="text-sm text-red-600 font-medium">{barcodeError}</p>
                      )}

                      <p className="text-xs text-muted-foreground text-center">
                        Point your camera at the barcode, or tap &ldquo;Scan from Photo&rdquo; to use an existing image.
                      </p>
                    </>
                  )}

                  {barcodeProduct && (
                    <div className="space-y-4">
                      {/* Product card */}
                      <div className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                        {barcodeProduct.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={barcodeProduct.image}
                            alt={barcodeProduct.name}
                            className="w-16 h-16 object-contain rounded-xl bg-white border border-border shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p className="font-bold text-sm leading-snug line-clamp-2 flex-1">{barcodeProduct.name}</p>
                            {barcodeProduct.grade && (
                              <GradeBadge grade={barcodeProduct.grade.grade} rationale={barcodeProduct.grade.rationale} size="md" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Serving: {barcodeProduct.servingLabel}</p>
                          <div className="grid grid-cols-4 gap-1 mt-2 text-center">
                            {[
                              { label: "kcal", value: Math.round(barcodeProduct.per100g.calories * (parseFloat(barcodeServings) || 1) * barcodeProduct.servingGrams / 100) },
                              { label: "P", value: Math.round(barcodeProduct.per100g.protein * (parseFloat(barcodeServings) || 1) * barcodeProduct.servingGrams / 100) },
                              { label: "C", value: Math.round(barcodeProduct.per100g.carbs * (parseFloat(barcodeServings) || 1) * barcodeProduct.servingGrams / 100) },
                              { label: "F", value: Math.round(barcodeProduct.per100g.fat * (parseFloat(barcodeServings) || 1) * barcodeProduct.servingGrams / 100) },
                            ].map(({ label, value }) => (
                              <div key={label} className="bg-white rounded-lg py-1">
                                <p className="text-xs font-bold">{value}</p>
                                <p className="text-[10px] text-muted-foreground">{label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Servings picker */}
                      <div>
                        <Label>Number of servings</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => setBarcodeServings(String(Math.max(0.25, Math.round((parseFloat(barcodeServings) || 1) * 4 - 1) / 4)))}
                            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg font-bold hover:bg-muted/80"
                          >−</button>
                          <Input
                            type="number"
                            min={0.25}
                            step={0.25}
                            value={barcodeServings}
                            onChange={(e) => setBarcodeServings(e.target.value)}
                            className="w-20 text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setBarcodeServings(String(Math.round((parseFloat(barcodeServings) || 1) * 4 + 1) / 4))}
                            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg font-bold hover:bg-muted/80"
                          >+</button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 gradient-orange text-white border-0"
                          onClick={confirmBarcodeProduct}
                        >
                          <Plus size={16} className="mr-2" /> Add to Log
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setBarcodeProduct(null); setBarcodeError(""); }}
                        >
                          <X size={16} className="mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "manual" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Describe what you ate — AI will estimate the macros. Or enter them yourself if you already know them.
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mt) => (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => setManualMealType(mt)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          manualMealType === mt ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {MEAL_LABELS[mt]}
                      </button>
                    ))}
                  </div>

                  <div>
                    <Label>What did you eat?</Label>
                    <div className="relative mt-1">
                      <Textarea
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        placeholder='e.g. "grilled chicken breast with rice and broccoli" or "2 eggs, avocado toast, large coffee"'
                        rows={3}
                        className="pr-12"
                        disabled={manualAnalyzing || (voiceListening && voiceTarget === "manual")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          voiceListening && voiceTarget === "manual"
                            ? stopVoiceListening()
                            : startVoiceListening("manual")
                        }
                        disabled={manualAnalyzing}
                        title={voiceListening && voiceTarget === "manual" ? "Stop listening" : "Speak your meal"}
                        className={`absolute right-2 top-2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          voiceListening && voiceTarget === "manual"
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-700"
                        }`}
                      >
                        {voiceListening && voiceTarget === "manual" ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    </div>
                    {voiceListening && voiceTarget === "manual" && (
                      <p className="text-xs text-orange-600 font-medium mt-1">Listening… tap mic to stop</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full gradient-orange text-white border-0"
                    onClick={analyzeManualDescription}
                    disabled={manualAnalyzing || !manualDescription.trim()}
                  >
                    {manualAnalyzing ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Estimating macros…</>
                    ) : (
                      <><Plus size={14} className="mr-1" /> Estimate macros with AI</>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setManualShowMacros((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 w-full text-center"
                  >
                    {manualShowMacros ? "Hide manual macro entry" : "I know the macros — enter them manually"}
                  </button>

                  {manualShowMacros && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div>
                        <Label>Food name</Label>
                        <Input
                          className="mt-1"
                          value={manualFood.name}
                          onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
                          placeholder="e.g. Grilled chicken breast"
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          className="mt-1"
                          value={manualFood.quantity}
                          onChange={(e) => setManualFood({ ...manualFood, quantity: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                          <div key={field}>
                            <Label className="text-xs">{field === "calories" ? "kcal" : `${field}g`}</Label>
                            <Input
                              type="number"
                              min={0}
                              value={manualFood[field] || ""}
                              onChange={(e) => setManualFood({ ...manualFood, [field]: Number(e.target.value) || 0 })}
                            />
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" className="w-full" onClick={startManualReview}>
                        <Plus size={14} className="mr-1" /> Continue to review
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {tab === "plan" && (
                <div className="space-y-2">
                  {!mealPlan ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No meal plan yet. <a href="/meal-plan" className="text-primary font-semibold">Generate one</a>
                    </p>
                  ) : todayMeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No meals found for today in your plan.</p>
                  ) : (
                    todayMeals.map((meal, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => startPlanReview(meal)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                      >
                        <div>
                          <p className="font-bold text-sm">{meal.name}</p>
                          <p className="text-xs text-muted-foreground">{meal.foods.length} items · {meal.totalCalories} kcal</p>
                        </div>
                        <Plus size={16} className="text-primary shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {tab === "recent" && (
                <div className="space-y-2">
                  {recentLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : recentFoods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent foods yet. Log some meals to see your history here.
                    </p>
                  ) : (
                    recentFoods.map((food, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const { lastUsed: _l, useCount: _u, grade, ...foodItem } = food;
                          const item: FoodItemWithGrade = grade ? { ...foodItem, grade } : foodItem;
                          setReview({ mealType: "snack", source: "manual", foods: [item], notes: "" });
                          setConfidence(undefined);
                          setAiNotes(undefined);
                          setEditingId(null);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                      >
                        {food.grade && (
                          <GradeBadge grade={food.grade.grade} rationale={food.grade.rationale} size="md" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{food.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {food.quantity} · {food.calories} kcal · {food.protein}P · {food.carbs}C · {food.fat}F
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{food.useCount}×</p>
                        </div>
                        <Plus size={16} className="text-primary shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Today's entries */}
        <div className="bg-white rounded-3xl card-shadow p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Today&apos;s log</p>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No food logged yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const entryTotals = sumFoods(entry.foods);
                return (
                  <div key={entry._id} className="p-4 rounded-2xl bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{MEAL_LABELS[entry.mealType]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.foods.map((f) => f.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black">{entryTotals.calories} kcal</p>
                        <p className="text-xs text-muted-foreground">
                          {entryTotals.protein}P · {entryTotals.carbs}C · {entryTotals.fat}F
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(entry)} disabled={!!review}>
                        <Pencil size={12} className="mr-1" /> Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => saveEntryAsMeal(entry)} disabled={!!review}>
                        <Bookmark size={12} className="mr-1" /> Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => deleteEntry(entry._id)} disabled={!!review}>
                        <Trash2 size={12} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
