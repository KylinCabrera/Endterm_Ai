# Running NutriGo with Docker

This starts the whole system (frontend, backend, and a local MongoDB) with one command. It does not touch the production database.

## Requirements

- Docker Desktop (the engine must be running)
- Internet access (the backend fetches Clerk's public keys to verify logins)
- The `.env` file sent by the team (or your own Gemini and Clerk values, see below)

## 1. Create the `.env` file

In the repository root, copy the template:

```powershell
Copy-Item .env.docker.example .env
```

On macOS/Linux:

```bash
cp .env.docker.example .env
```

Then fill in the values (skip this if the team already sent you a ready `.env`; just place it in the repository root):

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio (https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Leave the default |
| `CLERK_ISSUER_URL` | Clerk dashboard, API Keys (Frontend API URL, `https://....clerk.accounts.dev`, no trailing slash) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard, API Keys (starts with `pk_test_`) |

The `.env` file is ignored by Git and must never be committed.

## 2. Start

```bash
docker compose up --build
```

The first build can take a few minutes. Wait for `Uvicorn running on http://0.0.0.0:8000`.

## 3. Open

- App: http://localhost:5173
- API documentation: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Use `http://localhost:5173` exactly. The backend only accepts logins from that origin, so another port or `127.0.0.1` will fail with 401.

Sign up with any email on the sign-up page, then scan a nutrition label photo and add it to the cart.

## Stop and clean up

Press `Ctrl + C`, then:

```bash
docker compose down
```

Add `-v` to also delete the local MongoDB data volume.

## What is inside

| File | Purpose |
|---|---|
| `Dockerfile` | Backend image (Python 3.11, same as CI), runs as a non-root user |
| `frontend/Dockerfile` | Builds the React app with Node 22 and serves it with nginx |
| `frontend/nginx.conf` | Serves the single-page app (fallback to `index.html`) |
| `docker-compose.yml` | Starts MongoDB, the backend, and the frontend |
| `.env.docker.example` | Template for the `.env` file |

## Troubleshooting

| Problem | Fix |
|---|---|
| `Set GEMINI_API_KEY in the .env file` | The `.env` file is missing or a value is empty |
| `Cannot connect to the Docker daemon` | Open Docker Desktop and wait until the engine is running |
| `port is already allocated` | Stop whatever uses port 8000 or 5173 |
| "Cannot reach Clerk to verify your session" | `CLERK_ISSUER_URL` is wrong or the machine has no internet |
| Login returns 401 | Open the app at exactly `http://localhost:5173` |
| Scan fails | Check that `GEMINI_API_KEY` is valid |

## Notes

- Data is stored in a local MongoDB container, separate from production.
- Real keys are never stored in the repository.
- This does not change how the app is deployed on Render and Vercel.