/** Save text as a UTF-8 file on the user's device (no upload). */
export function downloadText(text: string, filename: string, mime = "text/plain"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Save binary data (e.g. an .apkg deck) on the user's device (no upload). */
export function downloadBlob(data: Uint8Array, filename: string, mime = "application/octet-stream"): void {
  const blob = new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Some browsers start the download after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
