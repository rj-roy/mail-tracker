import type {
  SendEmailMessage,
  SendEmailResponse,
} from "../shared/messages.js";

export interface ComposeWindow {
  container: HTMLElement;
  recipientInput: HTMLInputElement | null;

  getRecipient(): string;
  getSubject(): string;
  getBody(): string;
}

const SEND_BUTTON_SELECTORS = [
  "div[role='button'][data-tooltip='Send']",
  "div[role='button'][aria-label='Send']",
  "div[role='button'][data-tooltip^='Send']",
  "div[role='button'][aria-label^='Send']",
  "[role='button'][data-tooltip='Send']",
  "[role='button'][aria-label='Send']",
];

const RECIPIENT_SELECTORS = [
  "input[name='to']",
  "[name='to']",
  "input[aria-label*='Recipients']",
  "input[aria-label^='To ']",
  "input[data-original-name='To']",
  "div[aria-label^='To recipients']",
];

const SUBJECT_SELECTORS = [
  "input[name='subjectbox']",
  "input[aria-label*='Subject']",
  "input[placeholder*='Subject']",
];

const BODY_SELECTORS = [
  "[g_editable='true']",
  "div[role='textbox'][contenteditable='true']",
  "[aria-label^='Message Body']",
  "div[contenteditable='true']",
];

function queryFirst<T extends Element>(
  root: ParentNode,
  selectors: string[]
): T | null {
  for (const selector of selectors) {
    const el = root.querySelector<T>(selector);
    if (el) {
      return el;
    }
  }
  return null;
}

function composeContainerFrom(start: Element): HTMLElement | null {
  const common = start.closest<HTMLElement>(
    "div[role='dialog'], form[method='post'], [data-message-id]"
  );

  if (common) {
    return common;
  }

  let el: Element | null = start;

  while (el && el !== document.body) {
    if (el.querySelector(RECIPIENT_SELECTORS.join(", "))) {
      return el as HTMLElement;
    }
    el = el.parentElement;
  }

  return null;
}

function toRecipientString(input: HTMLInputElement | null): string {
  if (!input) {
    return "";
  }

  let value = "";

  if (typeof input.value === "string") {
    value = input.value;
  } else {
    const chips = input.querySelectorAll<HTMLElement>(
      "div[data-email], span[data-email], [data-hovercard-email]"
    );
    if (chips.length > 0) {
      value = Array.from(chips)
        .map((chip) => chip.getAttribute("data-email") ?? chip.textContent ?? "")
        .join(", ");
    } else {
      value = input.textContent ?? "";
    }
  }

  value = value.trim();

  if (!value) {
    return "";
  }

  return value
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean)
    .join(", ");
}

export function isSendButton(el: Element | null): boolean {
  if (!el) {
    return false;
  }

  return Boolean(
    el.closest<HTMLElement>(SEND_BUTTON_SELECTORS.join(", "))
  );
}

export function findComposeFromSendTarget(
  eventTarget: EventTarget | null
): ComposeWindow | null {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  const sendButton = eventTarget.closest<HTMLElement>(
    SEND_BUTTON_SELECTORS.join(", ")
  );

  if (!sendButton) {
    return null;
  }

  const container = composeContainerFrom(sendButton);

  if (!container) {
    return null;
  }

  return buildCompose(container);
}

export function findComposeFromActiveElement(): ComposeWindow | null {
  const active = document.activeElement;

  if (!(active instanceof Element)) {
    return null;
  }

  const container = composeContainerFrom(active);

  if (!container) {
    return null;
  }

  return buildCompose(container);
}

function buildCompose(container: HTMLElement): ComposeWindow | null {
  const recipientInput =
    queryFirst<HTMLInputElement>(container, RECIPIENT_SELECTORS) ??
    queryFirst<HTMLInputElement>(document, [
      "input[name='to']",
      "[name='to']",
    ]) ??
    null;

  const subjectInput = queryFirst<HTMLInputElement>(
    container,
    SUBJECT_SELECTORS
  ) ?? null;

  const emailBody = queryFirst<HTMLElement>(container, BODY_SELECTORS) ??
    null;

  return {
    container,
    recipientInput,
    getRecipient: () => toRecipientString(recipientInput),
    getSubject: () => subjectInput?.value ?? "",
    getBody: () => (emailBody?.textContent ?? "").trim(),
  };
}

export interface SendResult {
  ok: boolean;
  needsAuth?: boolean;
  error?: string;
}

export async function sendTrackedEmail(
  compose: ComposeWindow,
  sendMessage: (m: SendEmailMessage) => Promise<unknown>
): Promise<SendResult> {
  const recipient = compose.getRecipient();

  if (!recipient) {
    return { ok: false, error: "No recipient found." };
  }

  const message: SendEmailMessage = {
    type: "SEND_EMAIL",
    recipient,
    subject: compose.getSubject(),
    body: compose.getBody(),
  };

  const response = (await sendMessage(
    message
  )) as SendEmailResponse | undefined;

  if (!response) {
    return { ok: false, error: "No response from background." };
  }

  if (response.needsAuth) {
    return { ok: false, needsAuth: true };
  }

  if (!response.success) {
    return { ok: false, error: response.error };
  }

  return { ok: true };
}
