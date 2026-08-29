import { checkAuth } from "./api.js";

export type { AuthStatus } from "./api.js";

const API_BASE_URL = "http://localhost:5000";

export function getAuthBaseUrl(): string {
  return API_BASE_URL;
}

export async function getAuthStatus() {
  return checkAuth();
}

export async function openSignIn(): Promise<void> {
  await chrome.tabs.create({
    url: `${API_BASE_URL}/auth/google`,
    active: true,
  });
}
