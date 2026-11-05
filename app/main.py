import os
from contextlib import asynccontextmanager
import sentry_sdk
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ai_routes, cart_routes, profile_routes
from app.database import get_database
from app.ai_limits import scan_limits
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

load_dotenv()

SENTRY_DSN = os.getenv("SENTRY_DSN")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        environment=os.getenv("ENV", "development"),
        debug=False,
    )
else:
    print("⚠️ SENTRY_DSN is missing or empty!")

@asynccontextmanager
async def lifespan(app):
    scan_limits()
    await get_database().ai_usage.create_index('expires_at', expireAfterSeconds=0)
    yield


app = FastAPI(title="NutriGo AI API", version="1.0.0", lifespan=lifespan)

# Share an explicit origin list with Clerk token-origin validation.
raw_frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [url.strip().rstrip('/') for url in raw_frontend_urls.split(',') if url.strip()]
if not allowed_origins or '*' in allowed_origins:
    raise RuntimeError('FRONTEND_URL must contain explicit allowed frontend origins.')

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=['Retry-After'],
)

# Include API route modules
app.include_router(ai_routes.router)
app.include_router(cart_routes.router)
app.include_router(profile_routes.router)

@app.exception_handler(PyMongoError)
async def database_error(request, error):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable. Changes were not confirmed saved; please retry."})


@app.get("/")
def root():
    return {"status": "NutriGo AI API is running"}


@app.get("/health")
async def health_check():
    await get_database().command("ping")
    return {
        "status": "ok", "database": "connected",
        "environment": os.getenv("ENV", "development"),
        "version": app.version,
        "revision": os.getenv('RENDER_GIT_COMMIT') or os.getenv('APP_REVISION', 'local'),
    }
