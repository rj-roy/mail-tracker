import { registerTrackedEmail, sendEmail, fetchTrackedEmails } from "./api.js";
import { getAuthStatus, openSignIn } from "./auth.js";
import type {
  TrackEmailMessage,
  SendEmailMessage,
} from "../shared/messages.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Mail Tracker installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((result) => {
      sendResponse(result);
    })
    .catch((error: unknown) => {
      console.error("Mail Tracker: message handler error", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });

  return true;
});

async function handleMessage(
  message: unknown
): Promise<unknown> {
  if (!message || typeof message !== "object") {
    return { success: false, error: "Invalid message" };
  }

  const type = (message as { type?: string }).type;

  switch (type) {
    case "PING":
      return {
        success: true,
        message: "Background worker is alive",
      };

    case "TRACK_EMAIL": {
      const msg = message as TrackEmailMessage;
      await registerTrackedEmail(msg);
      return { success: true };
    }

    case "SEND_EMAIL": {
      const msg = message as SendEmailMessage;
      const result = await sendEmail(msg);

      if (result.needsAuth) {
        return {
          success: false,
          needsAuth: true,
          error: result.error,
        };
      }

      return result;
    }

    case "GET_AUTH_STATUS": {
      const status = await getAuthStatus();
      return status;
    }

    case "GET_TRACKED_EMAILS": {
      const emails = await fetchTrackedEmails();
      return { success: true, emails };
    }

    case "SIGN_IN": {
      await openSignIn();
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}
