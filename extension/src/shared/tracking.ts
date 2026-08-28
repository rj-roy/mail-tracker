const API_BASE_URL = "https://mail-tracker-mu.vercel.app";

export function generateTrackingId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function trackingPixelUrl(trackingId: string): string {
  return `${API_BASE_URL}/t/${encodeURIComponent(trackingId)}.gif`;
}
