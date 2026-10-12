from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes
from app.routes import auth_routes, ai_routes

app = FastAPI(title="NutriGo AI API", version="1.0.0")

# Allow React frontend to access backend APIs
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