import { handleSendEvent, handleSendShortcut } from "./tracker.js";

console.log("[Mail Tracker] content script loaded");

window.addEventListener("click", handleSendEvent, true);
window.addEventListener("mousedown", handleSendEvent, true);
window.addEventListener("keydown", handleSendShortcut, true);
