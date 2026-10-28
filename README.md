# NutriGo AI

AI-driven Smart Grocery & Nutrition Assistant.

## Branch Strategy
- `main`: Production-ready code.
- `dev`: Active development branch.
- `feature/<feature-name>`: Feature branches for PRs.

## Setup
1. `python -m venv venv`
2. `.\venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --reload`

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
