import type { ComposeWindow } from "./gmail-dom.js";
import { detectComposeWindow } from "./gmail-dom.js";
import { injectTrackingPixel } from "./pixel-injector.js";
import { generateTrackingId } from "../shared/tracking.js";
import type { TrackEmailMessage } from "../shared/messages.js";

export class ComposeTracker {
  private compose: ComposeWindow | null = null;

  get container(): HTMLElement | null {
    return this.compose?.container ?? null;
  }

  attach(compose: ComposeWindow): void {
    this.detach();
    this.compose = compose;

    compose.container.addEventListener(
      "click",
      this.handleSendClick,
      true
    );
  }

  detach(): void {
    if (!this.compose) {
      return;
    }

    this.compose.container.removeEventListener(
      "click",
      this.handleSendClick,
      true
    );

    this.compose = null;
  }

  private readonly handleSendClick = (event: MouseEvent): void => {
    if (!this.compose) {
      return;
    }

    const target = event.target as Element | null;

    if (
      !target ||
      !(this.compose.sendButton.contains(target) ||
        target === this.compose.sendButton)
    ) {
      return;
    }

    const recipient = this.compose.getRecipient();
    const subject = this.compose.getSubject();

    if (!recipient) {
      return;
    }

    const trackingId = generateTrackingId();

    injectTrackingPixel(this.compose, trackingId);

    this.notifyBackground({
      type: "TRACK_EMAIL",
      trackingId,
      recipient,
      subject,
    });
  };

  private notifyBackground(message: TrackEmailMessage): void {
    chrome.runtime
      .sendMessage(message)
      .catch((error: unknown) => {
        console.error("Mail Tracker: failed to notify background", error);
      });
  }
}
