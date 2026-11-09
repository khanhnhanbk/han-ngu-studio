import { fitSize, IMAGE_MAX_SIDE } from "./images";

/**
 * Fetch a picture (CORS-enabled URL) and re-encode it as a JPEG whose longer
 * side is at most IMAGE_MAX_SIDE, so a deck with pictures stays small. Runs
 * in the browser only (canvas). Null when the picture cannot be fetched or
 * decoded.
 */
export async function fetchShrunkJpeg(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const { w, h } = fitSize(bitmap.width, bitmap.height, IMAGE_MAX_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // White behind transparent pictures (JPEG has no alpha).
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}
