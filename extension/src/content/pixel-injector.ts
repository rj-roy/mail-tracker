import type { ComposeWindow } from "./gmail-dom.js";
import { trackingPixelUrl } from "../shared/tracking.js";

const PIXEL_SELECTOR = "img[data-mail-tracker-pixel]";

export function findInjectedPixel(
  emailBody: HTMLElement
): HTMLImageElement | null {
  return emailBody.querySelector<HTMLImageElement>(PIXEL_SELECTOR);
}

export function injectTrackingPixel(
  compose: ComposeWindow,
  trackingId: string
): HTMLImageElement | null {
  const body = compose.emailBody;

  if (findInjectedPixel(body)) {
    return null;
  }

  body.appendChild(createPixelElement(trackingId));

  return findInjectedPixel(body);
}

function createPixelElement(trackingId: string): HTMLImageElement {
  const pixel = document.createElement("img");

  pixel.width = 1;
  pixel.height = 1;

  pixel.alt = "";
  pixel.title = "";
  pixel.src = trackingPixelUrl(trackingId);
  pixel.setAttribute("data-mail-tracker-pixel", "true");

  return pixel;
}
