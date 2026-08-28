import { registerTrackedEmail } from "./api.js";
import type { TrackEmailMessage } from "../shared/messages.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Mail Tracker installed");
});

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({
        success: true,
        message: "Background worker is alive",
      });
      return false;
    }

    if (message.type === "TRACK_EMAIL") {
      handleTrackEmail(message as TrackEmailMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error: unknown) => {
          console.error("Mail Tracker: failed to record email", error);
          sendResponse({
            success: false,
            error: "Failed to record email",
          });
        });

      return true;
    }

    return false;
  }
);

async function handleTrackEmail(message: TrackEmailMessage): Promise<void> {
  await registerTrackedEmail(message);
}
