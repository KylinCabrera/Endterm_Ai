from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routes import profile_routes

@pytest.fixture
def client():
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[profile_routes.get_current_user_id] = lambda: 'user_one'
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)

def test_profile_requires_sign_in():
    assert TestClient(app).get('/api/profile').status_code == 401

def test_missing_profile_is_null(client):
    db = AsyncMock()
    db.user_profiles.find_one.return_value = None
    with patch.object(profile_routes, 'get_database', return_value=db):
        response = client.get('/api/profile')
    assert response.status_code == 200
    assert response.json() is None
    db.user_profiles.find_one.assert_awaited_once_with({'_id': 'user_one'})

def test_profile_save_then_load(client):
    db = AsyncMock()
    profile = {'height': 168, 'weight': 67, 'calorieLimit': 2000}
    with patch.object(profile_routes, 'get_database', return_value=db):
        response = client.put('/api/profile', json={**profile, 'user_id': 'other_user'})
        assert response.status_code == 200
        db.user_profiles.update_one.assert_awaited_once_with({'_id': 'user_one'}, {'$set': profile}, upsert=True)
        db.user_profiles.find_one.return_value = {'_id': 'user_one', **profile}
        loaded = client.get('/api/profile')
    assert loaded.json() == response.json() == profile

def test_profile_uses_current_account(client):
    app.dependency_overrides[profile_routes.get_current_user_id] = lambda: 'user_two'
    db = AsyncMock()
    db.user_profiles.find_one.return_value = None
    with patch.object(profile_routes, 'get_database', return_value=db):
        assert client.get('/api/profile').json() is None
    db.user_profiles.find_one.assert_awaited_once_with({'_id': 'user_two'})

def test_invalid_profile_is_not_saved(client):
    db = AsyncMock()
    with patch.object(profile_routes, 'get_database', return_value=db):
        response = client.put('/api/profile', json={'height': 0, 'weight': -1, 'calorieLimit': 0})
    assert response.status_code == 422
    db.user_profiles.update_one.assert_not_called()
