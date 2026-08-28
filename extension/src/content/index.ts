import { detectComposeWindow } from "./gmail-dom.js";
import { ComposeTracker } from "./tracker.js";

const activeTrackers: ComposeTracker[] = [];

function scanForComposeWindows(): void {
  const compose = detectComposeWindow();

  if (!compose) {
    return;
  }

  const alreadyTracked = activeTrackers.some(
    (tracker) => tracker.container === compose.container
  );

  if (alreadyTracked) {
    return;
  }

  const tracker = new ComposeTracker();
  tracker.attach(compose);
  activeTrackers.push(tracker);
}

function pruneStaleTrackers(): void {
  for (let index = activeTrackers.length - 1; index >= 0; index--) {
    const tracker = activeTrackers[index];

    if (tracker.container && !document.contains(tracker.container)) {
      tracker.detach();
      activeTrackers.splice(index, 1);
    }
  }
}

console.log("Mail Tracker content script loaded");

const observer = new MutationObserver(() => {
  scanForComposeWindows();
  pruneStaleTrackers();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

scanForComposeWindows();
