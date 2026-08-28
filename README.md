# Mail Tracker

Track email open events from Gmail.

A real Chrome/Chromium **Manifest V3 extension** + **Express/TypeScript API** + **MongoDB**.

```
mail-tracker/
│
├── extension/                  # Chrome extension (Vite + React + TypeScript)
│   ├── src/
│   │   ├── background/         # Service worker
│   │   ├── content/            # Gmail DOM script
│   │   ├── popup/              # Extension popup UI
│   │   └── shared/             # Shared code/types
│   ├── manifest.json
│   ├── package.json
│   └── tsconfig.json
│
├── server/                     # Express API (TypeScript)
│   ├── src/
│   │   ├── config/             # DB connection + indexes
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── api/index.ts            # Vercel serverless handler
│   ├── vercel.json
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

```
Extension
    ↓
Gmail integration / UI / authentication
    ↓
Express API
    ↓
MongoDB
```

The **tracking endpoint lives on the backend**, not inside the extension.

## Backend (Express + MongoDB)

Requirements: Node.js, and a running MongoDB instance
(e.g. `podman run -d --name mongo -p 27017:27017 mongo:7`).

```bash
cd server
npm install
npm run dev
```

- `MONGODB_URI` and `MONGODB_DB_NAME` come from `server/.env`.
- Health check: `curl http://localhost:5000/health`

### Deploy to Vercel

The server is set up to run on Vercel serverless functions:
a real handler at `api/index.ts` (with `vercel.json` routing all paths to it),
plus lazy MongoDB connection and index creation.

Before deploying, set these **Environment Variables** in your Vercel project
(Settings → Environment Variables), otherwise DB-backed routes return 500:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
MONGODB_DB_NAME=mail_tracker
```

Push the `server/` directory to the repo linked to your Vercel project and
redeploy. Example: `https://mail-tracker-mu.vercel.app`.

Typecheck the server and its Vercel handler:

```bash
cd server
npm run build          # compiles src/ -> dist/
npm run typecheck:api  # typechecks api/index.ts + src/
```

### Google OAuth (Gmail API)

Phase 4 uses backend-hosted OAuth. Set up in Google Cloud Console:

1. Enable the **Gmail API** for your project.
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
3. Add an authorized redirect URI matching `GOOGLE_REDIRECT_URI`
   (e.g. `https://mail-tracker-mu.vercel.app/auth/google/callback`).
4. Copy the client ID and secret into the environment:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://mail-tracker-mu.vercel.app/auth/google/callback
SESSION_SECRET=<random>
TOKEN_ENCRYPTION_KEY=<random>
APP_ORIGIN=https://mail-tracker-mu.vercel.app
```

These should be set in `server/.env` (local) and the Vercel project env vars
(production). Until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`
are set, `/auth/google` returns a clear "not configured" error.

Flow: extension popup → **Sign in with Google** opens the backend
`/auth/google` → Google consent → backend exchanges the code, stores tokens
(encrypted with `TOKEN_ENCRYPTION_KEY`), sets a signed session cookie →
Gmail API sends. The extension never holds the client secret.

**Bearer/refresh tokens are stored encrypted in MongoDB** and refreshed
transparently when they expire.

### Tracking flow (Gmail API)

When you click **Send** in Gmail compose, the content script intercepts the
send, cancels Gmail's native send, and asks the background to call
`POST /api/send`. The backend:

1. Creates a `tracked_emails` record (server-generated tracking ID).
2. Sends the email via the Gmail API with a 1×1 tracking `<img>` pixel.
3. Updates the record with the real Gmail message/thread IDs.

When the recipient's mail client loads the pixel, `GET /t/:trackingId.gif`
records an open event (hashed IP + user agent + referer).

## Extension (Chrome MV3)

```bash
cd extension
npm install
npm run build
cp manifest.json dist/manifest.json
```

Load `extension/dist` via `chrome://extensions` → **Developer mode** → **Load unpacked**.

Open `https://mail.google.com` and check the DevTools console for
`Mail Tracker content script loaded`, then click the extension icon and test
 the connection.

## Current status

**Phase 4 (Gmail API + OAuth) implemented:**

- Backend-hosted Google OAuth: `/auth/google`, `/auth/google/callback`,
  `/auth/me`, `/auth/logout`, `/auth/success`.
- Tokens stored **encrypted** in MongoDB (`users` collection) with transparent
  refresh; signed httpOnly session cookie.
- `POST /api/send` (auth required) sends the email via the Gmail API with a
  tracking pixel and records it.
- Extension sign-in in the popup (opens the backend OAuth flow), and the
  content script intercepts Send to route through the backend instead of
  Gmail's native send.
- `GET /t/:trackingId.gif` unchanged: returns a 1×1 GIF and records opens.

**Not yet implemented:** status indicators in the Gmail UI (Phase 5),
production hardening (rate limiting, abuse prevention).


