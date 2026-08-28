export function getAppOrigin(): string {
  return process.env.APP_ORIGIN ?? "http://localhost:5000";
}

export function trackingPixelUrl(trackingId: string): string {
  return `${getAppOrigin()}/t/${encodeURIComponent(trackingId)}.gif`;
}
