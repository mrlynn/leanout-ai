"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, Trash2, Columns2 } from "lucide-react";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { getDateString } from "@/lib/foodLog";

interface PhotoMeta {
  _id: string;
  date: string;
  notes?: string;
  weightLbs?: number;
  createdAt: string;
}

export function ProgressPhotos() {
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [compareImages, setCompareImages] = useState<[string, string] | null>(null);
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
      const imageData = await resizeImageToDataUrl(file, 800);
      await fetch("/api/progress/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getDateString(), imageData }),
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
    setCompareImages([a.photo.imageData, b.photo.imageData]);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading photos…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">Progress photos</p>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            Add photo
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No progress photos yet. Snap your first one to track visual changes.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((p) => (
            <div key={p._id} className="relative group">
              <button
                type="button"
                className="w-full aspect-[3/4] rounded-2xl bg-muted overflow-hidden border-2 border-border hover:border-primary transition-colors"
                onClick={() => {
                  if (!compareIds) setCompareIds([p._id, p._id]);
                  else if (compareIds[0] === compareIds[1]) setCompareIds([compareIds[0], p._id]);
                  else setCompareIds([compareIds[0], p._id]);
                }}
              >
                <PhotoThumb id={p._id} />
              </button>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <button onClick={() => remove(p._id)} className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {compareIds && compareIds[0] !== compareIds[1] && (
        <Button size="sm" className="rounded-xl gap-1.5" onClick={startCompare}>
          <Columns2 size={14} /> Compare selected
        </Button>
      )}

      {compareImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setCompareImages(null)}>
          <div className="grid grid-cols-2 gap-2 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {compareImages.map((src, i) => (
              <img key={i} src={src} alt={`Compare ${i + 1}`} className="rounded-2xl w-full object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/progress/photos/${id}`).then((r) => r.json()).then((d) => setSrc(d.photo?.imageData));
  }, [id]);
  if (!src) return <div className="w-full h-full flex items-center justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  return <img src={src} alt="" className="w-full h-full object-cover" />;
}
