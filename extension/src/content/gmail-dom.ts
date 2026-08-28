export interface ComposeWindow {
  container: HTMLElement;
  recipientInput: HTMLInputElement;
  subjectInput: HTMLInputElement;
  emailBody: HTMLElement;
  sendButton: HTMLElement;

  getRecipient(): string;
  getSubject(): string;
}

function emailBodySelector(): string[] {
  return [
    "[role='textbox'][contenteditable='true']",
    "[aria-label^='Message Body']",
    "[g_editable='true']",
    "div[role='textbox'][g_editable='true']",
  ];
}

function query<ElementType extends Element>(
  root: Document | HTMLElement,
  selectors: string[]
): ElementType | null {
  for (const selector of selectors) {
    const el = root.querySelector<ElementType>(selector);
    if (el) {
      return el;
    }
  }
  return null;
}

function findComposeContainer(): HTMLElement | null {
  const dialog = document.querySelector<HTMLElement>(
    "div[role='dialog'][aria-label*='New Message'], " +
      "div[role='dialog'][aria-label^='New Message']"
  );

  if (dialog) {
    return dialog;
  }

  const fullscreen = document.querySelector<HTMLElement>(
    "form[method='post']"
  );

  if (fullscreen && fullscreen.querySelector<HTMLInputElement>("[name='to']")) {
    return fullscreen;
  }

  return null;
}

export function detectComposeWindow(): ComposeWindow | null {
  const container = findComposeContainer();

  if (!container) {
    return null;
  }

  const recipientInput = container.querySelector<HTMLInputElement>(
    "input[name='to']"
  );

  const subjectInput = container.querySelector<HTMLInputElement>(
    "input[name='subjectbox'], input[placeholder*='Subject']"
  );

  const sendButton = query<HTMLElement>(container, [
    "div[role='button'][data-tooltip='Send']",
    "div[role='button'][aria-label='Send']",
    "div[role='button'][data-tooltip^='Send']",
  ]);

  const emailBody = query<HTMLElement>(container, emailBodySelector());

  if (!recipientInput || !sendButton) {
    return null;
  }

  const getRecipient = () =>
    recipientInput.value
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean)
      .join(", ");

  const getSubject = () =>
    subjectInput?.value ?? "";

  return {
    container,
    recipientInput,
    subjectInput: subjectInput ?? container.querySelector("[name='subjectbox']")!,
    emailBody: emailBody ?? container.querySelector("[g_editable='true']") ?? container,
    sendButton,
    getRecipient,
    getSubject,
  };
}
