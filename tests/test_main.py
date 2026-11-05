from fastapi.testclient import TestClient
from app.main import app  # Imports the FastAPI instance from app/main.py
from unittest.mock import AsyncMock
from pymongo.errors import ConnectionFailure
import app.main as main

client = TestClient(app)

def test_read_root():
    # Sends a simulated request to @app.get("/") in main.py
    response = client.get("/")
    assert response.status_code == 200

def test_ai_route():
    response = client.get("/api/ai/test")
    assert response.status_code == 200


def test_startup_index_and_deployed_revision(monkeypatch):
    db = AsyncMock()
    monkeypatch.setattr(main, 'get_database', lambda: db)
    monkeypatch.setenv('RENDER_GIT_COMMIT', 'release-sha')
    with TestClient(app) as live_client:
        response = live_client.get('/health')
    assert response.status_code == 200
    assert response.json()['revision'] == 'release-sha'
    assert response.json()['database'] == 'connected'
    db.ai_usage.create_index.assert_awaited_once_with('expires_at', expireAfterSeconds=0)


def test_database_failure_returns_readable_error(monkeypatch):
    db = AsyncMock()
    db.command.side_effect = ConnectionFailure('private connection details')
    monkeypatch.setattr(main, 'get_database', lambda: db)
    response = client.get('/health')
    assert response.status_code == 503
    assert 'private connection details' not in response.text
    assert 'Database unavailable' in response.json()['detail']


def test_legacy_registration_does_not_report_fake_success():
    assert client.post('/api/register', json={}).status_code == 404


def test_browser_can_read_retry_after_header():
    origin = main.allowed_origins[0]
    response = client.get('/', headers={'Origin': origin})
    assert response.headers['access-control-allow-origin'] == origin
    assert 'Retry-After' in response.headers['access-control-expose-headers']
