import { put, del } from "@vercel/blob";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function uploadImage(file: File): Promise<{ url: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image must be under 8 MB");
  }
  const blob = await put(file.name, file, { access: "public" });
  return { url: blob.url };
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
