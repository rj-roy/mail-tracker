import type { ComposeWindow } from "./gmail-dom.js";
import type {
  SendEmailMessage,
  SendEmailResponse,
} from "../shared/messages.js";

export class ComposeTracker {
  private compose: ComposeWindow | null = null;

  private sending = false;

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
    if (!this.compose || this.sending) {
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

    if (!recipient) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const message: SendEmailMessage = {
      type: "SEND_EMAIL",
      recipient,
      subject: this.compose.getSubject(),
      body: this.compose.getBody(),
    };

    void this.send(message);
  };

  private async send(message: SendEmailMessage): Promise<void> {
    this.sending = true;

    try {
      const response = (await chrome.runtime.sendMessage(
        message
      )) as SendEmailResponse;

      if (response?.needsAuth) {
        this.showToast(
          "Sign in to Mail Tracker to send tracked emails."
        );
        return;
      }

      if (!response?.success) {
        this.showToast(
          response?.error ?? "Failed to send tracked email."
        );
        return;
      }

      this.showToast("Tracked email sent.");
    } catch (error) {
      console.error("Mail Tracker: failed to send email", error);
      this.showToast("Failed to send tracked email.");
    } finally {
      this.sending = false;
    }
  }

  private showToast(message: string): void {
    const existing = document.querySelector(
      "[data-mail-tracker-toast]"
    );
    existing?.remove();

    const toast = document.createElement("div");
    toast.setAttribute("data-mail-tracker-toast", "true");
    toast.textContent = message;

    toast.style.cssText = [
      "position: fixed",
      "top: 16px",
      "left: 50%",
      "transform: translateX(-50%)",
      "z-index: 2147483646",
      "background: #1f2933",
      "color: #fff",
      "padding: 10px 16px",
      "border-radius: 6px",
      "font-family: system-ui, sans-serif",
      "font-size: 13px",
      "box-shadow: 0 4px 12px rgba(0,0,0,0.25)",
    ].join(";");

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
  }
}
