import io
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from app.routes import ai_routes as ai

NUTRITION = dict(item_name='Oats', calories=150, protein=5, carbs=27, fat=3, sodium=140)


def image_bytes(fmt='PNG'):
    output = io.BytesIO()
    Image.new('RGB', (32, 24), 'white').save(output, format=fmt)
    return output.getvalue()


@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(ai.router)
    app.dependency_overrides[ai.get_current_user_id] = lambda: 'test-user'
    monkeypatch.setenv('GEMINI_API_KEY', 'test-key')
    monkeypatch.setenv('GEMINI_MODEL', 'test-model')
    return TestClient(app)


def mock_provider(monkeypatch, outcome):
    generate = AsyncMock(side_effect=[outcome])
    context = MagicMock()
    context.__aenter__ = AsyncMock(return_value=SimpleNamespace(
        models=SimpleNamespace(generate_content=generate)))
    context.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(ai.genai, 'Client', MagicMock(return_value=SimpleNamespace(aio=context)))
    return generate


def scan(client, data=None, mime='image/png'):
    return client.post('/api/ai/scan-label', files={
        'file': ('label.png', image_bytes() if data is None else data, mime),
    })


@pytest.mark.parametrize('fmt,mime', [('JPEG', 'image/jpeg'), ('PNG', 'image/png'), ('WEBP', 'image/webp')])
def test_scan_returns_sodium_and_normalizes_image(client, monkeypatch, fmt, mime):
    generate = mock_provider(monkeypatch, SimpleNamespace(text=json.dumps(NUTRITION)))
    data = image_bytes(fmt)
    result = scan(client, data, mime)
    assert result.status_code == 200
    assert result.json() == NUTRITION
    call = generate.call_args.kwargs
    assert call['model'] == 'test-model'
    with Image.open(io.BytesIO(call['contents'][0].inline_data.data)) as image:
        assert image.format == 'JPEG'
        assert image.size == (32, 24)
    assert call['contents'][0].inline_data.mime_type == 'image/jpeg'
    assert 'sodium' in call['config'].response_schema.model_fields


@pytest.mark.parametrize('sodium', [None, 0, 140, 140.5, 400, 400.1, 2300])
def test_sodium_values_round_trip(client, monkeypatch, sodium):
    mock_provider(monkeypatch, SimpleNamespace(text=json.dumps({**NUTRITION, 'sodium': sodium})))
    result = scan(client)
    assert result.status_code == 200
    assert result.json()['sodium'] == sodium


@pytest.mark.parametrize('changes', [{'sodium': -1}, {'sodium': 'unknown'}, {'sodium': float('inf')}, {'item_name': '   '}])
def test_invalid_extraction_rejected(client, monkeypatch, changes):
    mock_provider(monkeypatch, SimpleNamespace(text=json.dumps({**NUTRITION, **changes})))
    assert scan(client).status_code == 422


def test_omitted_sodium_not_silently_zero(client, monkeypatch):
    data = {key: value for key, value in NUTRITION.items() if key != 'sodium'}
    mock_provider(monkeypatch, SimpleNamespace(text=json.dumps(data)))
    result = scan(client)
    assert result.status_code == 200
    assert result.json()['sodium'] is None


@pytest.mark.parametrize('outcome,status', [
    (ai.errors.APIError(429, {'message': 'quota'}), 503),
    (ai.errors.APIError(404, {'message': 'missing model'}), 502),
    (ai.errors.APIError(503, {'message': 'unavailable'}), 503),
    (ai.httpx.ReadTimeout('timeout'), 504),
    (TimeoutError(), 504),
    (SimpleNamespace(text='{}'), 422),
])
def test_scan_failures(client, monkeypatch, outcome, status):
    generate = mock_provider(monkeypatch, outcome)
    assert scan(client).status_code == status
    assert generate.await_count == 1


@pytest.mark.parametrize('data,mime', [(b'', 'image/png'), (b'x' * (10 * 1024 * 1024 + 1), 'image/png'), (b'gif', 'image/gif'), (b'not an image', 'image/png'), (image_bytes('GIF'), 'image/png')], ids=['empty', 'oversized', 'unsupported', 'corrupt', 'disguised'])
def test_invalid_upload_never_calls_provider(client, monkeypatch, data, mime):
    generate = mock_provider(monkeypatch, SimpleNamespace(text=json.dumps(NUTRITION)))
    assert scan(client, data, mime).status_code == 400
    generate.assert_not_awaited()


def test_missing_key(client, monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY')
    assert scan(client).status_code == 503


def test_unknown_mime_uses_verified_image_bytes(client, monkeypatch):
    mock_provider(monkeypatch, SimpleNamespace(text=json.dumps(NUTRITION)))
    assert scan(client, mime='application/octet-stream').status_code == 200


@pytest.mark.parametrize('model', [None, '   '])
def test_default_model_stays_flash_lite(client, monkeypatch, model):
    if model is None:
        monkeypatch.delenv('GEMINI_MODEL')
    else:
        monkeypatch.setenv('GEMINI_MODEL', model)
    generate = mock_provider(monkeypatch, SimpleNamespace(text=json.dumps(NUTRITION)))
    assert scan(client).status_code == 200
    assert generate.call_args.kwargs['model'] == 'gemini-3.5-flash-lite'


def test_large_dimensions_rejected_before_provider(client, monkeypatch):
    generate = mock_provider(monkeypatch, SimpleNamespace(text=json.dumps(NUTRITION)))
    image = MagicMock()
    image.format = 'PNG'
    image.width, image.height = 6000, 6000
    context = MagicMock()
    context.__enter__.return_value = image
    monkeypatch.setattr(ai.Image, 'open', MagicMock(return_value=context))
    assert scan(client, b'image').status_code == 400
    generate.assert_not_awaited()


def test_normalization_respects_exif_orientation():
    image = Image.new('RGB', (32, 24), 'white')
    exif = image.getexif()
    exif[274] = 6
    output = io.BytesIO()
    image.save(output, format='JPEG', exif=exif)
    with Image.open(io.BytesIO(ai.normalize_image(output.getvalue()))) as normalized:
        assert normalized.size == (24, 32)


def test_requires_authentication():
    app = FastAPI()
    app.include_router(ai.router)
    assert scan(TestClient(app)).status_code == 401
