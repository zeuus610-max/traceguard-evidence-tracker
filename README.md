# TraceGuard — Digital Evidence Tracker

TraceGuard is a local full stack prototype based on the Digital Crime Investigation and Evidence Tracker presentation. It focuses on organizing case and evidence metadata, recording authorized custody events, and keeping a time-stamped activity history.

The workspace does not upload or store evidence files, access devices or accounts, or perform forensic extraction.

## Run locally

Requirements: Node.js 18+ and Python 3.10+.

Install the API dependencies once:

```sh
python3 -m pip install -r requirements.txt
```

Start both local services from one Terminal window:

```sh
bash ./start-local.sh
```

Keep that Terminal window open while using the website. Press `Control+C` there to stop both services.

Open the local address printed by Vite (usually `http://localhost:5173`). The FastAPI service runs at `http://127.0.0.1:8000`; interactive API docs are available at `http://127.0.0.1:8000/docs`. The cinematic landing page uses the provided remote video and falls back to its navy background if the video is unavailable. The first API start creates `traceguard.sqlite3` in this folder and seeds fictional demo records.

## Demo accounts

All accounts use the password `TraceGuard!2026`:

| Role | Email | Access |
| --- | --- | --- |
| Administrator | `admin@traceguard.local` | Create, edit, and view records |
| Investigator | `investigator@traceguard.local` | Create, edit, and view records |
| Viewer | `viewer@traceguard.local` | Read-only access |

The demo credentials are for local evaluation only. This prototype uses in-memory sessions, so signing out or restarting the API ends active sessions. The database can be moved by setting `TRACEGUARD_DB`.

## Included modules

- Case register with case reference, title, lead, status, dates, and notes.
- Evidence register with a unique evidence reference, category, description, date received, source, status, and reference location.
- Chain-of-custody event history with action, from/to references, handler, notes, and timestamp.
- Role-aware sign-in, activity history, search, case filtering, and CSV report export.
- SQLite persistence, password hashing with PBKDF2-HMAC-SHA-256, server-side input validation, and role checks.

## Notes

Demo records are fictional. This is a class-project prototype, not a certified evidence-management system. It does not provide production deployment controls, encrypted database storage, multi-factor authentication, backups, or legal evidence-integrity guarantees. Keep real sensitive information out of the demo database.

## Public demo deployment

The Docker image builds the React frontend and serves it and the FastAPI API from one web service. `render.yaml` configures a free Render preview in read-only demo mode. That mode seeds a viewer account only, so visitors can browse the sample records but cannot create or change records.

The free preview uses temporary storage and may sleep after inactivity. Its fictional sample data is reseeded after a restart; it is not suitable for real or long-lived case data. A durable deployment needs managed database storage and private user provisioning.

To deploy, put this folder in a private GitHub repository, sign in to Render, connect that repository, and create a new Blueprint from `render.yaml`. Render will provide a public `onrender.com` address after its first build.
