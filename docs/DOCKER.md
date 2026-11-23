# Running the backend with Docker

This runs the FastAPI backend and a local MongoDB with one command. It does not touch the Atlas database, and it uses dummy keys, so no real secrets are needed.

## Requirements

- Docker Desktop (the engine must be running)

## Start

From the repository root:

```bash
docker compose up --build
```

Then open:

- http://localhost:8000 (health message)
- http://localhost:8000/docs (API documentation)

## Stop and clean up

Press `Ctrl + C`, then:

```bash
docker compose down
```

Add `-v` to also delete the local MongoDB data volume.

## What is inside

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the backend image (Python 3.11, same as CI) and runs it as a non-root user |
| `.dockerignore` | Keeps `.env`, `.git`, the frontend, and tests out of the image |
| `docker-compose.yml` | Starts the backend and a local MongoDB |

## Notes

- `docker-compose.yml` uses a dummy `GEMINI_API_KEY`, so the label scan will not return real results. Everything else (cart, profile, health) works against the local database.
- To test the AI scan locally, run the image with your own key from an untracked `.env` file and never commit it:

  ```bash
  docker run --rm -p 8000:8000 --env-file .env nutrigo-backend
  ```
- The container listens on `$PORT` when it is set (as on Render) and on 8000 otherwise.
- The frontend is deployed separately on Vercel and is not part of this image.
- This does not change how the backend is deployed on Render today.