/** Save a blob (for example a canvas PNG) as a file on the user's device (no upload). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Save bytes as a file on the user's device (no upload). */
export function downloadBytes(bytes: Uint8Array, filename: string, mime = "application/octet-stream"): void {
  downloadBlob(new Blob([bytes as BlobPart], { type: mime }), filename);
}

/** Save text as a UTF-8 file on the user's device (no upload). */
export function downloadText(text: string, filename: string, mime = "text/plain"): void {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}
