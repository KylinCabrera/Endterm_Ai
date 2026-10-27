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
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite
```

Fallback models are comma-separated, tried in order, deduplicated, and capped at three total models. Set the fallback variable to an empty string to disable fallback. Each attempt has a 20-second limit; the provider operation has a 45-second total limit. Rate limits, unavailable models, temporary server/network failures, timeouts, and invalid nutrition responses trigger fallback. Invalid credentials and invalid provider requests stop immediately. Models must support image input and structured JSON output. Shared key/project quota exhaustion can affect every model.

Uploads accept JPEG, PNG, and WebP up to 10 MB and 25 megapixels. The backend validates actual bytes, corrects EXIF orientation, places transparent images on white, and converts to JPEG with a maximum 4096-pixel edge. GIF, SVG, and HEIC are unsupported; export them as JPEG or PNG first. All models and the cart use the same validated nutrition response fields.

Run backend tests with `python -m pytest` from this directory. Run `npm run build` and `npm run lint` from `frontend`.
