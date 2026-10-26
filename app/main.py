import os
import sentry_sdk
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from app.routes import ai_routes, cart_routes, profile_routes
from app.database import get_database
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

app = FastAPI(title="NutriGo AI API", version="1.0.0")

# Parse allowed origins cleanly from environment or fallback to wildcards for preview deployments
raw_frontend_urls = os.getenv("FRONTEND_URL", "*")

if raw_frontend_urls == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [url.strip() for url in raw_frontend_urls.split(",") if url.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User Registration Schema
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

# Standalone Registration Route
@app.post("/api/register")
async def register_user(user_data: UserRegister):
    print(f"Received user registration for: {user_data.email}")
    
    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "email": user_data.email,
            "name": user_data.name
        }
    }

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
    return {"status": "ok", "database": "connected", "environment": os.getenv("ENV", "development")}