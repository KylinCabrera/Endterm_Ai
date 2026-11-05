# API reference

Base URL is your backend origin. FastAPI serves interactive `/docs`, `/redoc`, and `/openapi.json`. Protected routes require `Authorization: Bearer <Clerk session token>` from the configured Clerk application and frontend origin. Never send a Gemini key from the browser.

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/` | No | Backend process status only; does not check MongoDB. |
| GET | `/health` | No | Checks MongoDB; returns status, database, environment, version and full deployed revision. |
| GET | `/api/ai/test` | No | AI module status only; makes no provider call. |
| POST | `/api/ai/scan-label` | Yes | Multipart image field `file`; validates/normalizes, reserves allowance, invokes Gemini, validates output. |
| POST | `/api/cart` | Yes | Creates an item for this account; returns 201. |
| GET | `/api/cart` | Yes | Lists this account's items. |
| GET | `/api/cart/{id}` | Yes | Reads one owned item. |
| PUT | `/api/cart/{id}` | Yes | Updates supplied non-null fields on an owned item. |
| DELETE | `/api/cart/{id}` | Yes | Deletes an owned item; returns 204. |
| GET | `/api/profile` | Yes | Saved profile, or null when not set. |
| PUT | `/api/profile` | Yes | Validates and upserts this account's complete profile. |

## Scan and cart shapes

Uploads accept JPEG, PNG, WebP, at most 10 MiB and 25 megapixels. Actual file bytes must be valid images. Missing upload fields and malformed multipart receive validation errors. Non-label/unreadable model output is rejected when detected by the response schema; real-model reliability requires evaluation.

Successful scan example (illustrative, not a measured label result):

```json
{"item_name":"Oats","calories":150,"protein":5,"carbs":27,"fat":3,"sodium":140}
```

POST the reviewed object to `/api/cart` with optional `quantity` (integer >=1, default 1). The response also includes `id`. Names are trimmed and must contain 1–200 characters. Nutrient values must be finite and nonnegative; absent sodium is null. Cart macros/calories default to zero when omitted by manual clients. Legacy price fields are ignored on creation and not returned. Updating an item removes an old price field. PUT ignores nulls, so it cannot currently clear an existing sodium value to null.

Profile PUT example:

```json
{"height":170,"weight":65,"calorieLimit":2000}
```

Height: 50–250 cm; weight: 10–400 kg; shopping calorie limit: 200–10000 kcal. All must be finite. These are shopping settings, not prescribed nutritional intake.

## Errors

Errors generally contain `{"detail":"readable explanation"}`. FastAPI request-validation errors use a detail array with field locations/messages. The frontend formats both forms.

| Status | Meaning and recovery |
| --- | --- |
| 400 | Invalid/corrupt/oversized image, invalid item ID, or empty cart update. Correct the input. |
| 401 | Missing or invalid session; sign in again. |
| 404 | Item absent or belongs to another account. |
| 422 | Malformed request fields, invalid nutrition, or unreadable AI result. |
| 429 | Application scan allowance exhausted. Respect `Retry-After` in seconds. |
| 502 | Provider rejected the request, configured model unavailable, or unexpected scan failure. |
| 503 | Missing backend configuration, database/allowance failure, Clerk verification unavailable, provider quota exhausted or provider temporarily unavailable. |
| 504 | Provider operation timed out. |

Application limits default to 5/user/minute, 50/user/UTC day, 500/app/UTC day. Failed provider attempts count. Limits do not guarantee an exact monetary ceiling. Browser network failures, unreadable successful responses, and 65-second deadlines produce local readable messages. Mutating requests are never automatically retried; verify current saved state after an ambiguous network failure.
