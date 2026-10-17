import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_status():
    """Verify health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "NutriGo AI API is running"}

def test_cart_invalid_id_format():
    """Verify invalid item ID format returns 400 Bad Request."""
    response = client.get("/api/cart/invalid-object-id")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid item ID format"

@patch("app.routes.cart_routes.get_database")
def test_cart_get_nonexistent(mock_get_db):
    """Verify missing item IDs return 404 Not Found without needing live MongoDB."""
    mock_db = AsyncMock()
    mock_db.cart_items.find_one = AsyncMock(return_value=None)
    mock_get_db.return_value = mock_db

    valid_fake_id = "507f1f77bcf86cd799439011"
    response = client.get(f"/api/cart/{valid_fake_id}")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Cart item not found"