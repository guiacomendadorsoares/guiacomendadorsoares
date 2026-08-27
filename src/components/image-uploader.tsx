import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";
import {
  uploadImage,
  uploadMedia,
  deleteImageByUrl,
  getDisplayImageUrl,
  getDisplayImageUrls,
} from "@/lib/storage";

interface SingleProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  aspect?: "square" | "wide";
}

export function SingleImageUploader({ value, onChange, folder, aspect = "square" }: SingleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(value ?? null);

  useEffect(() => {
    let alive = true;
    getDisplayImageUrl(value).then((url) => {
      if (alive) setDisplayUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [value]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!value) return;
    try {
      await deleteImageByUrl(value);
    } catch {}
    onChange(null);
  }

  const ratio = aspect === "wide" ? "aspect-[16/7]" : "aspect-square";

  return (
    <div className="space-y-2">
      <div
        className={`relative ${ratio} w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/30`}
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive shadow-card"
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center gap-2 text-xs text-muted-foreground"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                <span>Clique para enviar</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

interface MediaProps {
  value: string | null | undefined;
  mediaType?: "image" | "gif" | "video";
  onChange: (next: { url: string | null; type?: "image" | "gif" | "video" }) => void;
  folder: string;
  aspect?: "square" | "wide";
}

/** Uploader que aceita imagem, GIF e vídeo (mp4/webm). */
export function SingleMediaUploader({
  value,
  mediaType,
  onChange,
  folder,
  aspect = "wide",
}: MediaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { url, type } = await uploadMedia(file, folder);
      onChange({ url, type });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar mídia");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (value) {
      try {
        await deleteImageByUrl(value);
      } catch {}
    }
    onChange({ url: null });
  }

  const ratio = aspect === "wide" ? "aspect-[16/7]" : "aspect-square";
  const isVideo = mediaType === "video" || (value ?? "").match(/\.(mp4|webm|mov)(\?|$)/i);

  return (
    <div className="space-y-2">
      <div
        className={`relative ${ratio} w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/30`}
      >
        {value ? (
          <>
            {isVideo ? (
              <video
                src={value}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <img src={value} alt="preview" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive shadow-card"
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center gap-2 text-xs text-muted-foreground"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Film className="h-5 w-5" />
                <span>Imagem, GIF ou vídeo</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

interface GalleryProps {
  value: string[] | null | undefined;
  onChange: (urls: string[]) => void;
  folder: string;
  max: number;
}

export function GalleryUploader({ value, onChange, folder, max }: GalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const items = useMemo(() => value ?? [], [value]);
  const remaining = Math.max(0, max - items.length);
  const [displayItems, setDisplayItems] = useState<string[]>(items);

  useEffect(() => {
    let alive = true;
    getDisplayImageUrls(items).then((urls) => {
      if (alive) setDisplayItems(urls);
    });
    return () => {
      alive = false;
    };
  }, [items]);

  async function handleFiles(files: FileList) {
    if (remaining === 0) {
      toast.error(`Limite de ${max} fotos atingido para o seu plano.`);
      return;
    }
    setUploading(true);
    const slice = Array.from(files).slice(0, remaining);
    const next = [...items];
    for (const file of slice) {
      try {
        const url = await uploadImage(file, folder);
        next.push(url);
        onChange([...next]);
      } catch (e: any) {
        toast.error(e.message ?? "Erro ao enviar imagem");
      }
    }
    setUploading(false);
  }

  function remove(i: number) {
    const url = items[i];
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
    if (url) deleteImageByUrl(url).catch(() => {});
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {items.length} / {max} fotos
        </span>
        {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((url, i) => (
          <div
            key={url + i}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={displayItems[i] ?? url}
              alt={`foto ${i + 1}`}
              className="h-full w-full object-cover"
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="rounded bg-background/80 p-1"
                aria-label="Mover esquerda"
              >
                <ArrowLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded bg-background/80 p-1 text-destructive"
                aria-label="Remover"
              >
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="rounded bg-background/80 p-1"
                aria-label="Mover direita"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid aspect-square place-items-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 text-[10px] text-muted-foreground hover:bg-muted/60"
          >
            <Upload className="h-4 w-4" />
            Adicionar
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const f = e.target.files;
          e.target.value = "";
          if (f && f.length) handleFiles(f);
        }}
      />
    </div>
  );
}
