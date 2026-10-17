import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_status():
    """Verify backend health endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "NutriGo AI API is running"}

def test_cart_crud_validation():
    """Verify invalid item IDs return 400 Bad Request."""
    response = client.get("/api/cart/invalid-object-id")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid item ID format"

def test_cart_get_nonexistent():
    """Verify missing item IDs return 404 Not Found."""
    valid_fake_id = "507f1f77bcf86cd799439011"
    response = client.get(f"/api/cart/{valid_fake_id}")
    assert response.status_code == 404