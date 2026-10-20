import pytest

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.routes import cart_routes


TEST_USER_ID = "user_test_123"


@pytest.fixture
def authenticated_client():
    """Simulate a signed-in user for cart unit tests."""
    previous_overrides = app.dependency_overrides.copy()

    app.dependency_overrides[
        cart_routes.get_current_user_id
    ] = lambda: TEST_USER_ID

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


def test_root_status():
    client = TestClient(app)

    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "NutriGo AI API is running"
    }


def test_cart_requires_login():
    """A request without a session must be rejected."""
    client = TestClient(app)

    response = client.get("/api/cart")

    assert response.status_code == 401


def test_cart_invalid_id_format(authenticated_client):
    response = authenticated_client.get(
        "/api/cart/invalid-object-id"
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Invalid item ID format"
    )


def test_cart_get_nonexistent(authenticated_client):
    """A signed-in user gets 404 for a missing item."""
    mock_db = AsyncMock()
    mock_db.cart_items.find_one.return_value = None

    with patch.object(
        cart_routes,
        "get_database",
        return_value=mock_db,
    ):
        response = authenticated_client.get(
            "/api/cart/507f1f77bcf86cd799439011"
        )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Cart item not found"
    )

    query = mock_db.cart_items.find_one.call_args.args[0]

    # Confirm that the lookup checks ownership.
    assert query["user_id"] == TEST_USER_ID
    assert str(query["_id"]) == (
        "507f1f77bcf86cd799439011"
    )


def test_create_cart_item(authenticated_client):
    """Save groceries under the authenticated user's ID."""
    from bson import ObjectId

    mock_db = AsyncMock()
    inserted_id = ObjectId()

    mock_db.cart_items.insert_one.return_value.inserted_id = (
        inserted_id
    )

    with patch.object(
        cart_routes,
        "get_database",
        return_value=mock_db,
    ):
        response = authenticated_client.post(
            "/api/cart",
            json={
                "item_name": "Rolled Oats",
                "calories": 190,
                "protein": 7,
                "carbs": 32,
                "fat": 3.5,
                "quantity": 1,
                "price": 99,
            },
        )

    assert response.status_code == 201
    assert response.json()["id"] == str(inserted_id)
    assert response.json()["item_name"] == "Rolled Oats"

    saved_document = (
        mock_db.cart_items.insert_one.call_args.args[0]
    )

    assert saved_document["user_id"] == TEST_USER_ID
    assert saved_document["price"] == 99