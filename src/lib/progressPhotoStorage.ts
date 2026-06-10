/** Optional Vercel Blob upload when BLOB_READ_WRITE_TOKEN is set. */

export async function uploadProgressPhoto(
  userId: string,
  date: string,
  pose: string,
  imageData: string
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { put } = await import("@vercel/blob");
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const blob = await put(`progress-photos/${userId}/${date}-${pose}.jpg`, buffer, {
      access: "public",
      contentType: "image/jpeg",
    });
    return blob.url;
  } catch (e) {
    console.error("[progressPhotoStorage]", e);
    return null;
  }
}

export async function deleteProgressBlob(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !url.includes("blob.vercel-storage.com")) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch {
    // best effort
  }
}
