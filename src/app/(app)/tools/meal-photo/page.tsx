"use client";

import { useRef, useState } from "react";
import { Camera, Upload, RotateCcw, Flame, Beef, Wheat, Droplets, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resizeImageToDataUrl } from "@/lib/imageResize";

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AnalysisResult {
  foods: FoodItem[];
  mealType: string;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

const CONFIDENCE_CONFIG = {
  high: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-100", label: "High confidence" },
  medium: { icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", label: "Medium confidence" },
  low: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 border-red-100", label: "Low confidence — portions unclear" },
};

export default function MealPhotoPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreview(dataUrl);
      setLoading(true);

      const res = await fetch("/api/food-log/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  const totals = result
    ? result.foods.reduce(
        (acc, f) => ({
          calories: acc.calories + f.calories,
          protein: acc.protein + f.protein,
          carbs: acc.carbs + f.carbs,
          fat: acc.fat + f.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : null;

  const confidence = result ? CONFIDENCE_CONFIG[result.confidence] : null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meal Photo Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Snap a photo of any meal — AI estimates the nutrition instantly.
          </p>
        </div>
      </div>

      {/* Upload area */}
      {!preview && (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Take or upload a photo</p>
            <p className="text-sm text-muted-foreground mt-1">JPEG or PNG · max 4MB</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => cameraRef.current?.click()}
              className="gap-2"
            >
              <Camera className="w-4 h-4" /> Take Photo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Photo
            </Button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview + loading */}
      {preview && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm aspect-video bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Meal preview" className="w-full h-full object-cover" />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                <p className="text-white text-sm font-semibold">Analyzing your meal…</p>
              </div>
            )}
          </div>

          {!loading && (
            <Button variant="outline" size="sm" onClick={reset} className="gap-2 w-full">
              <RotateCcw className="w-4 h-4" /> Analyze a different photo
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Analysis failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && totals && confidence && (
        <div className="mt-5 space-y-4">
          {/* Confidence badge */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${confidence.bg} ${confidence.color}`}>
            <confidence.icon className="w-4 h-4 shrink-0" />
            <span>{confidence.label}</span>
            {result.notes && <span className="font-normal opacity-80">— {result.notes}</span>}
          </div>

          {/* Totals */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
              Total — {result.mealType}
            </p>
            <div className="gradient-orange rounded-xl p-4 text-white text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-semibold">Total Calories</span>
              </div>
              <p className="text-5xl font-black">{totals.calories}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <Beef className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-red-600">{totals.protein}g</p>
                <p className="text-xs text-red-400">Protein</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <Wheat className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-amber-600">{totals.carbs}g</p>
                <p className="text-xs text-amber-400">Carbs</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-blue-600">{totals.fat}g</p>
                <p className="text-xs text-blue-400">Fat</p>
              </div>
            </div>
          </div>

          {/* Per-item breakdown */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold mb-3">Breakdown by food item</p>
            <div className="space-y-3">
              {result.foods.map((food, i) => (
                <div key={i} className="border border-border rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{food.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{food.calories} cal</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="text-red-500 font-medium">{food.protein}g protein</span>
                    <span className="text-amber-500 font-medium">{food.carbs}g carbs</span>
                    <span className="text-blue-500 font-medium">{food.fat}g fat</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Estimates only — actual values vary by portion size, preparation method, and ingredients.
          </p>
        </div>
      )}
    </div>
  );
}
