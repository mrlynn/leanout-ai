"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2, Columns2, Sparkles } from "lucide-react";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { getDateString } from "@/lib/foodLog";

type PhotoPose = "front" | "side" | "back";

interface PhotoMeta {
  _id: string;
  date: string;
  pose?: PhotoPose;
  notes?: string;
  weightLbs?: number;
  createdAt: string;
}

const POSES: { id: PhotoPose; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];

export function ProgressPhotos() {
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pose, setPose] = useState<PhotoPose>("front");
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [compareImages, setCompareImages] = useState<[string, string] | null>(null);
  const [slider, setSlider] = useState(50);
  const [commentary, setCommentary] = useState<{ headline: string; observations: string[]; encouragement: string } | null>(null);
  const [commentaryLoading, setCommentaryLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch("/api/progress/photos")
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    setUploading(true);
    try {
      const imageData = await resizeImageToDataUrl(file, 1280);
      await fetch("/api/progress/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getDateString(), pose, imageData }),
      });
      load();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/progress/photos?id=${id}`, { method: "DELETE" });
    setPhotos((p) => p.filter((x) => x._id !== id));
  }

  async function startCompare() {
    if (!compareIds) return;
    const [a, b] = await Promise.all(
      compareIds.map((id) => fetch(`/api/progress/photos/${id}`).then((r) => r.json()))
    );
    const img = (p: { photo: { imageData?: string; blobUrl?: string } }) =>
      p.photo.blobUrl ?? p.photo.imageData ?? "";
    setCompareImages([img(a), img(b)]);
    setCommentary(null);
  }

  async function getCoachTake() {
    if (!compareIds) return;
    setCommentaryLoading(true);
    const res = await fetch("/api/progress/photos/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beforeId: compareIds[0], afterId: compareIds[1], optIn: true }),
    });
    const data = await res.json();
    if (data.commentary) setCommentary(data.commentary);
    setCommentaryLoading(false);
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {POSES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPose(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              pose === p.id ? "gradient-orange text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Same spot, same lighting, {pose} pose.</p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl gradient-orange border-0 gap-2">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        Add {pose} photo
      </Button>

      {photos.length >= 2 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Columns2 size={14} className="text-muted-foreground" />
          <select className="text-sm border rounded-xl px-2 py-1" onChange={(e) => setCompareIds((prev) => [e.target.value, prev?.[1] ?? ""] as [string, string])}>
            <option value="">Before</option>
            {photos.map((p) => <option key={p._id} value={p._id}>{p.date} ({p.pose ?? "front"})</option>)}
          </select>
          <select className="text-sm border rounded-xl px-2 py-1" onChange={(e) => setCompareIds((prev) => [prev?.[0] ?? "", e.target.value] as [string, string])}>
            <option value="">After</option>
            {photos.map((p) => <option key={p._id} value={p._id}>{p.date} ({p.pose ?? "front"})</option>)}
          </select>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={startCompare} disabled={!compareIds?.[0] || !compareIds?.[1]}>
            Compare
          </Button>
        </div>
      )}

      {compareImages && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-w-sm mx-auto card-shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={compareImages[0]} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${slider}%` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={compareImages[1]} alt="After" className="w-full h-full object-cover" style={{ width: `${100 / (slider / 100)}%`, maxWidth: "none" }} />
            </div>
            <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(Number(e.target.value))} className="absolute bottom-2 left-2 right-2 z-10" />
          </div>
          <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={getCoachTake} disabled={commentaryLoading}>
            {commentaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Get coach&apos;s take
          </Button>
          {commentary && (
            <div className="rounded-2xl bg-orange-50 p-4 text-sm space-y-2">
              <p className="font-bold">{commentary.headline}</p>
              <ul className="list-disc pl-4 text-muted-foreground">
                {commentary.observations?.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
              <p className="text-muted-foreground">{commentary.encouragement}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p) => (
          <div key={p._id} className="relative group rounded-2xl bg-muted/40 p-3 card-shadow">
            <p className="text-xs font-bold">{p.date}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{p.pose ?? "front"}</p>
            {p.weightLbs && <p className="text-xs">{p.weightLbs} lbs</p>}
            <button type="button" onClick={() => remove(p._id)} className="absolute top-2 right-2 p-1 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
