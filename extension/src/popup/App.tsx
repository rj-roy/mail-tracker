import { useEffect, useState } from "react";
import type { AuthStatusResponse } from "../shared/messages.js";

type Status =
  | { state: "idle" }
  | { state: "ok"; message: string }
  | { state: "error"; message: string };

export default function App() {
  const [auth, setAuth] = useState<
    AuthStatusResponse | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<Status>({
    state: "idle",
  });
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    refreshAuthStatus();
  }, []);

  const refreshAuthStatus = async () => {
    try {
      const response = (await chrome.runtime.sendMessage({
        type: "GET_AUTH_STATUS",
      })) as AuthStatusResponse;
      setAuth(response);
    } catch (error) {
      setAuth({ signedIn: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await chrome.runtime.sendMessage({ type: "SIGN_IN" });
      await refreshAuthStatus();
      setTestStatus({
        state: "ok",
        message:
          "Complete Google sign-in in the opened tab, then return and click Check status.",
      });
    } catch {
      setTestStatus({
        state: "error",
        message: "Failed to open sign-in.",
      });
    } finally {
      setSigningIn(false);
    }
  };

  const runBackgroundPing = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "PING" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response?.message ?? "Background worker is alive");
      });
    });
  };

  const runApiHealth = async (): Promise<string> => {
    const response = await fetch(
      "https://mail-tracker-mu.vercel.app/health",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      message?: string;
    };
    return data.message ?? "Backend is reachable";
  };

  const handleTest = async () => {
    setTestStatus({ state: "idle" });

    try {
      const backgroundMessage = await runBackgroundPing();
      const apiMessage = await runApiHealth();

      setTestStatus({
        state: "ok",
        message: `Background: ${backgroundMessage}. API: ${apiMessage}`,
      });
    } catch (error) {
      setTestStatus({
        state: "error",
        message:
          error instanceof Error ? error.message : "Connection failed",
      });
    }
  };

  return (
    <main
      style={{
        width: 320,
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Mail Tracker</h2>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>
          Google account
        </h3>

        {loading ? (
          <p style={{ margin: 0, color: "#666" }}>Checking…</p>
        ) : auth?.signedIn ? (
          <div>
            <p style={{ margin: 0 }}>{auth.name}</p>
            <p style={{ margin: "2px 0 8px", color: "#1a7f37" }}>
              {auth.email}
            </p>
            <button onClick={() => void handleSignIn()}>
              Check status
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: "0 0 8px", color: "#cf222e" }}>
              Not signed in
            </p>
            <button
              onClick={() => void handleSignIn()}
              disabled={signingIn}
            >
              {signingIn ? "Opening…" : "Sign in with Google"}
            </button>
          </div>
        )}
      </section>

      <button onClick={() => void handleTest()}>Test Connection</button>

      {testStatus.state === "ok" && (
        <p style={{ color: "#1a7f37" }}>{testStatus.message}</p>
      )}
      {testStatus.state === "error" && (
        <p style={{ color: "#cf222e" }}>{testStatus.message}</p>
      )}
    </main>
  );
}
