# NutriGo AI

AI-driven Smart Grocery & Nutrition Assistant.

## Branch Strategy
- `main`: Production-ready code.
- `dev`: Active development branch.
- `feature/<feature-name>`: Feature branches for PRs.

## Setup

Use Python 3.11+ and Node.js 22. The backend needs MongoDB (local or Atlas), a Clerk application, and a Gemini API key. Never commit real environment files.

From the repository root in PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

Edit the copied files before starting. Backend variables:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URL`, `DB_NAME` | MongoDB connection and database. The DB user needs read/write and index-creation permission. |
| `CLERK_ISSUER_URL` | Exact HTTPS issuer origin for your Clerk instance, without a path or trailing slash. |
| `FRONTEND_URL` | Comma-separated exact browser origins, e.g. `http://localhost:5173`; production must include the real frontend HTTPS origin. Wildcards are rejected. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Backend-only provider credentials and an image/structured-output-capable model accessible to your project. |
| `AI_SCANS_PER_MINUTE` | Positive per-user minute limit; default 5. |
| `AI_SCANS_PER_DAY` | Positive per-user UTC-day limit; default 50. |
| `AI_GLOBAL_SCANS_PER_DAY` | Positive shared UTC-day limit across users; default 500. |
| `SENTRY_DSN` | Optional; leave blank to disable reporting. |
| `ENV` | Deployment label, e.g. `development` or `production`. |
| `APP_REVISION` | Full deployed commit SHA outside Render. Render's `RENDER_GIT_COMMIT` takes precedence. |

The legacy JWT variables in the example are only for unused legacy auth modules. Active login uses Clerk. Configure the frontend's `VITE_API_URL=http://localhost:8000` and `VITE_CLERK_PUBLISHABLE_KEY` for the **same Clerk application** as the backend issuer. Only publishable browser configuration belongs in `VITE_*` variables.

Start the backend:

```powershell
python -m uvicorn app.main:app --reload
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Register/sign in through Clerk. Backend startup creates a TTL index for shared AI counters; MongoDB must be reachable before startup can succeed. Missing or invalid scan-limit settings fail closed rather than allowing unlimited requests.

## Documentation and release evidence

- [Architecture and current request flow](docs/ARCHITECTURE.md)
- [API reference and error behavior](docs/API.md) (interactive schema at backend `/docs`; JSON at `/openapi.json`)
- [External deployment, measurement, rollback, and release steps](docs/RELEASE_CHECKLIST.md)
- [Pipeline timing record](docs/PIPELINE_MEASUREMENTS.md)
- [AI evaluation procedure](evaluations/README.md)
- [Changelog](CHANGELOG.md)

The release checklist remains pending until actual hosting, browser, pipeline, evaluation, and rollback evidence is recorded. A passing local test suite alone does not certify production readiness.

## Scan safeguards

Valid images reserve a scan attempt in MongoDB before calling Gemini. Atomic counters share limits across workers/restarts; quota exhaustion returns `429` with `Retry-After`. Database failure returns `503` without calling Gemini. Provider failures still consume attempts; reservations are conservative and are not refunded if a later limit rejects the request. Invalid uploads consume no scan allowance.

These are fixed minute/day windows, so bursts can occur across a window boundary. Daily limits reset at midnight UTC. Expired counters are removed by MongoDB's TTL index; deletion timing does not affect resets. Call allowances bound request volume, **not an exact currency budget**. Also set provider billing/quota controls in the external project.

Browser requests have a 65-second deadline, including response-body reads. They do not automatically retry writes. If a save times out, refresh the cart before retrying because the database may already have committed it.

## Nutrition image scanning

Install dependencies from `requirements.txt` (including Pillow). Set these backend variables:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

The scan handler uses one model with a 40-second HTTP timeout and a 45-second total limit. The model must support image input and structured JSON output. The current handler does not use `GEMINI_FALLBACK_MODELS`. Model access and quota depend on your API key's project.

On Render, set `GEMINI_MODEL=gemini-3.5-flash-lite` in the backend service's Environment settings and redeploy. An existing Render environment variable overrides the code default; changing your local `.env` does not update Render. Use a valid `GEMINI_API_KEY` from your Google AI Studio project. A 429 error requires checking that project's quota and billing; changing code cannot increase quota. If a scan returns 401, sign in again before retrying.

Uploads accept JPEG, PNG, and WebP up to 10 MB and 25 megapixels. The backend verifies actual image bytes, corrects orientation, and resizes to at most 4096 pixels per side before sending JPEG to Gemini. GIF, SVG, and HEIC are unsupported; export them as JPEG or PNG first. Omitted sodium is returned as `null`; invalid nutrition values still reject the scan.

## Sodium and scan review

Scans return calories (kcal), protein/carbs/fat (g), and `sodium` (mg), all per labeled serving. The prompt requests conversion of sodium in grams to milligrams and returns `null` if sodium is missing or unreadable. Missing values are never presented as zero or low sodium.

Users review scan results and edit the item name before adding it to their cart. Saved items also have an Edit name action. Cart quantity represents the number of labeled servings; the sodium badge and bar always describe one serving.

The app's per-serving guide is low at ≤140 mg, moderate at >140–400 mg, and high above 400 mg. Fractional values use these exact boundaries. The progress bar compares one serving with a 2,000 mg/day adult reference, based on [WHO guidance](https://www.who.int/news-room/fact-sheets/detail/sodium-reduction). It is not a consumption tracker or the label's printed percent daily value. A value of 400 mg is exactly 20% of this reference and remains moderate under the app's rule.

Price is no longer stored for new items or returned by the API. Existing database records without sodium return `null`; legacy price fields are removed when an item is updated. No bulk database migration is required, and no sodium is inferred for old records.

Run backend tests with `python -m pytest` from this directory. Run `npm test`, `npm run build`, and `npm run lint` from `frontend`.
