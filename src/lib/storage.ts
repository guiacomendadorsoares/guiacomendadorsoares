import { supabase } from "@/integrations/supabase/client";

const BUCKET = "uploads";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

export async function uploadImage(file: File, folder: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Faça login para enviar imagens.");
  if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Imagem acima de 10MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload de mídia (imagem, GIF ou vídeo). Limite 50MB. */
export async function uploadMedia(
  file: File,
  folder: string,
): Promise<{ url: string; type: "image" | "gif" | "video" }> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Faça login para enviar mídia.");
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) throw new Error("Envie uma imagem, GIF ou vídeo.");
  const limit = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
  if (file.size > limit) throw new Error(`Arquivo acima de ${isVideo ? "50MB" : "15MB"}.`);

  const ext = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
  const path = `${uid}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const type: "image" | "gif" | "video" = isVideo
    ? "video"
    : file.type === "image/gif"
      ? "gif"
      : "image";
  return { url: data.publicUrl, type };
}

export function storagePathFromPublicUrl(url: string): string | null {
  if (!url) return null;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:") && !url.startsWith("blob:"))
    return url;

  const publicMarker = `/storage/v1/object/public/${BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${BUCKET}/`;
  const marker = url.includes(publicMarker)
    ? publicMarker
    : url.includes(signedMarker)
      ? signedMarker
      : null;
  if (!marker) return null;
  const i = url.indexOf(marker);
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export async function getDisplayImageUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  // O bucket "uploads" é público — devolvemos a URL diretamente.
  // Gerar signed URL por imagem custava dezenas de round-trips por render (home lenta).
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const path = storagePathFromPublicUrl(url) ?? url;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
// Mantido para compat futura (não usado no caminho quente).
void SIGNED_URL_TTL_SECONDS;

export async function getDisplayImageUrls(urls: string[] | null | undefined): Promise<string[]> {
  if (!Array.isArray(urls)) return [];
  return Promise.all(urls.map(async (url) => (await getDisplayImageUrl(url)) ?? url));
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
