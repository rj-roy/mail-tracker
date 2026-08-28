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
npx tsc -p tsconfig.api.json   # typechecks api/index.ts + src/
```

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

**Implemented (Phase 2 — Gmail integration + tracking pixel):**

- Content script detects Gmail compose windows (`gmail-dom.ts`).
- On send click (capture-phase interception), it injects a 1×1 tracking
  `<img>` pixel into the compose body pointing at the backend
  (`pixel-injector.ts`, `tracker.ts`).
- Background worker receives `TRACK_EMAIL` from the content script and
  registers the email with the API (`background/api.ts`).
- Server endpoints:
  - `POST /api/tracked-emails` — register a tracked email.
  - `GET /t/:trackingId.gif` — returns a 1×1 transparent GIF and records an
    open event (hashed IP + user agent + referer) in `email_opens`.

**Not yet implemented:** Gmail OAuth (Phase 4), status indicators in the
Gmail UI (Phase 5), authentication/session management, production hardening.

