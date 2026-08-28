import {
  findComposeFromActiveElement,
  findComposeFromSendTarget,
  isSendButton,
  sendTrackedEmail,
  type ComposeWindow,
} from "./gmail-dom.js";

let sending = false;

export function handleSendEvent(event: MouseEvent): void {
  log("send event", event.type);

  if (sending) {
    return;
  }

  if (!isSendButton(event.target as Element | null)) {
    return;
  }

  log("send button hit on", event.type);

  event.preventDefault();
  event.stopImmediatePropagation();

  const compose = findComposeFromSendTarget(event.target);

  if (!compose) {
    warn("compose not found for send button");
    showToast("Mail Tracker: could not find the compose window.");
    return;
  }

  let recipient = "";

  try {
    recipient = compose.getRecipient();
  } catch (error) {
    console.error("Mail Tracker: failed to read recipient", error);
  }

  if (!recipient) {
    warn("recipient not found; send blocked");
    showToast("Mail Tracker: no recipient detected.");
    return;
  }

  log("intercepting send to", recipient);

  void doSend(compose);
}

export function handleSendShortcut(event: KeyboardEvent): void {
  log("keydown", event.key);

  if (sending) {
    return;
  }

  if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const compose = findComposeFromActiveElement();

  if (!compose) {
    return;
  }

  void doSend(compose);
}

async function doSend(compose: ComposeWindow): Promise<void> {
  sending = true;

  try {
    const result = await sendTrackedEmail(compose, (message) =>
      chrome.runtime.sendMessage(message)
    );

    if (result.needsAuth) {
      showToast("Sign in to Mail Tracker to send tracked emails.");
      warn("send blocked: not signed in");
    } else if (!result.ok) {
      showToast(result.error ?? "Failed to send tracked email.");
      warn("send failed:", result.error);
    } else {
      showToast("Tracked email sent.");
    }
  } catch (error) {
    console.error("Mail Tracker: send error", error);
    showToast("Failed to send tracked email.");
  } finally {
    sending = false;
  }
}

export function showToast(message: string): void {
  const existing = document.querySelector("[data-mail-tracker-toast]");
  existing?.remove();

  const toast = document.createElement("div");
  toast.setAttribute("data-mail-tracker-toast", "true");
  toast.textContent = message;

  toast.style.cssText = [
    "position: fixed",
    "top: 16px",
    "left: 50%",
    "transform: translateX(-50%)",
    "z-index: 2147483647",
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

function log(...args: unknown[]): void {
  console.log("[Mail Tracker]", ...args);
}

function warn(...args: unknown[]): void {
  console.warn("[Mail Tracker]", ...args);
}
