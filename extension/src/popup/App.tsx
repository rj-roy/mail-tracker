import { useEffect, useState } from "react";
import type {
  AuthStatusResponse,
  TrackedEmailEntry,
} from "../shared/messages.js";

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
  const [trackedEmails, setTrackedEmails] = useState<
    TrackedEmailEntry[]
  >([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  useEffect(() => {
    refreshAuthStatus();
  }, []);

  useEffect(() => {
    if (auth?.signedIn) {
      fetchTrackedEmailsList();
    }
  }, [auth?.signedIn]);

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

  const fetchTrackedEmailsList = async () => {
    setEmailsLoading(true);
    try {
      const response = (await chrome.runtime.sendMessage({
        type: "GET_TRACKED_EMAILS",
      })) as { success?: boolean; emails?: TrackedEmailEntry[] };
      setTrackedEmails(response.emails ?? []);
    } catch {
      setTrackedEmails([]);
    } finally {
      setEmailsLoading(false);
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
      "http://localhost:5000/health",
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

      {auth?.signedIn && (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>
            Tracked emails
          </h3>

          {emailsLoading ? (
            <p style={{ margin: 0, color: "#666" }}>Loading…</p>
          ) : trackedEmails.length === 0 ? (
            <p style={{ margin: 0, color: "#666" }}>No tracked emails yet.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {trackedEmails.map((email) => (
                <li
                  key={email.trackingId}
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px 0",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {email.subject || "(no subject)"}
                  </div>
                  <div style={{ fontSize: 12, color: "#57606a" }}>
                    {email.recipient}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      color: email.openCount > 0 ? "#1a7f37" : "#cf222e",
                    }}
                  >
                    {email.openCount > 0
                      ? `Opened ${email.openCount} time${email.openCount > 1 ? "s" : ""}`
                      : "Not opened yet"}
                  </div>
                  {email.lastOpenedAt && (
                    <div style={{ fontSize: 11, color: "#8b949e" }}>
                      Last opened{" "}
                      {new Date(email.lastOpenedAt).toLocaleString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => void fetchTrackedEmailsList()}
            style={{ marginTop: 8 }}
          >
            Refresh
          </button>
        </section>
      )}
    </main>
  );
}
