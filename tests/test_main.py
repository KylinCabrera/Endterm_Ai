from fastapi.testclient import TestClient
from app.main import app  # Imports the FastAPI instance from app/main.py

client = TestClient(app)

def test_read_root():
    # Sends a simulated request to @app.get("/") in main.py
    response = client.get("/")
    assert response.status_code == 200

def test_ai_route():
    response = client.get("/api/ai/test")
    assert response.status_code == 200