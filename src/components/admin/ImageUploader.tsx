import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEN_YEARS = 60 * 60 * 24 * 3650;
const MAX_MB = 5;

async function uploadOne(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("Could not create image link");
  return data.signedUrl;
}

export function ImageUploader({
  images,
  cover,
  onChange,
}: {
  images: string[];
  cover: string | null;
  onChange: (images: string[], cover: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const tooBig = list.filter((f) => f.size > MAX_MB * 1024 * 1024);
      if (tooBig.length) toast.error(`Skipped ${tooBig.length} file(s) over ${MAX_MB}MB`);
      const valid = list.filter((f) => f.size <= MAX_MB * 1024 * 1024);
      if (!valid.length) return;

      setBusy(true);
      try {
        const urls = await Promise.all(valid.map(uploadOne));
        const next = [...images, ...urls];
        onChange(next, cover ?? next[0] ?? null);
        toast.success(`${urls.length} image(s) uploaded`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [images, cover, onChange],
  );

  const removeAt = (url: string) => {
    const next = images.filter((i) => i !== url);
    onChange(next, cover === url ? (next[0] ?? null) : cover);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">Drag &amp; drop images here, or</p>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="mr-1 h-4 w-4" /> Upload images
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · up to {MAX_MB}MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url) => (
            <div
              key={url}
              className={cn(
                "group relative overflow-hidden rounded-lg border",
                cover === url ? "border-primary ring-2 ring-primary/40" : "border-border",
              )}
            >
              <img src={url} alt="Product upload preview" className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 px-1 py-1">
                <button
                  type="button"
                  onClick={() => onChange(images, url)}
                  aria-label="Set as cover image"
                  className="rounded p-1 hover:bg-muted"
                >
                  <Star className={cn("h-4 w-4", cover === url ? "fill-primary text-primary" : "text-muted-foreground")} />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(url)}
                  aria-label="Remove image"
                  className="rounded p-1 hover:bg-muted"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">Tap the star to choose the cover image shown on the storefront.</p>
      )}
    </div>
  );
}
