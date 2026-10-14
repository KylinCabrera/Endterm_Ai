import os
import sentry_sdk
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, ai_routes

# Load local .env variables into os.environ
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

app = FastAPI(title="NutriGo AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(ai_routes.router)

@app.get("/")
def root():
    return {"status": "NutriGo AI API is running"}