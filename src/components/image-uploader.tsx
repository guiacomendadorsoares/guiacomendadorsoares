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
  onUploadStateChange?: (uploading: boolean) => void;
  folder: string;
  label?: string;
  aspect?: "square" | "wide";
}

export function SingleImageUploader({
  value,
  onChange,
  onUploadStateChange,
  folder,
  aspect = "square",
}: SingleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(value ?? null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getDisplayImageUrl(value).then((url) => {
      if (alive) setDisplayUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [value]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  async function handleFile(file: File) {
    setUploadError(null);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(file);
    setDisplayUrl(previewRef.current);
    setUploading(true);
    onUploadStateChange?.(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      setDisplayUrl(url);
      toast.success("Imagem carregada");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao enviar imagem";
      setUploadError(message);
      setDisplayUrl((await getDisplayImageUrl(value)) ?? null);
      toast.error(message);
    } finally {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      setUploading(false);
      onUploadStateChange?.(false);
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
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-background/70" role="status">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
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
      {uploadError && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {uploadError}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void handleFile(f);
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
  onUploadStateChange?: (uploading: boolean) => void;
  folder: string;
  max: number;
}

export function GalleryUploader({
  value,
  onChange,
  onUploadStateChange,
  folder,
  max,
}: GalleryProps) {
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

  async function handleFiles(files: File[]) {
    if (remaining === 0) {
      toast.error(`Limite de ${max} fotos atingido para o seu plano.`);
      return;
    }
    setUploading(true);
    onUploadStateChange?.(true);
    const slice = files.slice(0, remaining);
    const next = [...items];
    try {
      for (const file of slice) {
        try {
          const url = await uploadImage(file, folder);
          next.push(url);
          onChange([...next]);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Erro ao enviar imagem";
          toast.error(message);
        }
      }
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
    }
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
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void handleFiles(files);
        }}
      />
    </div>
  );
}
