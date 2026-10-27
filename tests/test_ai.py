import io
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from app.routes import ai_routes as ai

NUTRITION = dict(item_name='Oats', calories=150, protein=5, carbs=27, fat=3)


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
    monkeypatch.setenv('GEMINI_MODEL', 'primary')
    monkeypatch.setenv('GEMINI_FALLBACK_MODELS', 'fallback')
    return TestClient(app)


def mock_provider(monkeypatch, outcomes):
    generate = AsyncMock(side_effect=outcomes)
    context = MagicMock()
    context.__aenter__ = AsyncMock(return_value=SimpleNamespace(
        models=SimpleNamespace(generate_content=generate)))
    context.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(ai.genai, 'Client', MagicMock(return_value=SimpleNamespace(aio=context)))
    return generate


def response(data=NUTRITION):
    import json
    return SimpleNamespace(text=json.dumps(data))


@pytest.mark.parametrize('fmt', ['JPEG', 'PNG', 'WEBP'])
def test_image_formats_and_actual_bytes(client, monkeypatch, fmt):
    generate = mock_provider(monkeypatch, [response()])
    result = client.post('/api/ai/scan-label', files={'file': ('photo', image_bytes(fmt), 'application/octet-stream')})
    assert result.status_code == 200
    assert result.json() == NUTRITION
    part = generate.call_args.kwargs['contents'][0].inline_data
    assert part.mime_type == 'image/jpeg'
    with Image.open(io.BytesIO(part.data)) as image:
        assert image.format == 'JPEG'


@pytest.mark.parametrize('failure', [
    ai.errors.APIError(429, {'message': 'quota'}),
    ai.errors.APIError(503, {'message': 'unavailable'}),
    ai.errors.APIError(404, {'message': 'model missing'}),
    TimeoutError(), httpx.ConnectError('offline'),
    SimpleNamespace(text='invalid JSON'),
    response({**NUTRITION, 'protein': -1}),
    response({**NUTRITION, 'item_name': '   '}),
])
def test_fallback_preserves_image_and_schema(client, monkeypatch, failure):
    generate = mock_provider(monkeypatch, [failure, response()])
    result = client.post('/api/ai/scan-label', files={'file': ('x.png', image_bytes(), 'image/png')})
    assert result.status_code == 200
    assert [call.kwargs['model'] for call in generate.call_args_list] == ['primary', 'fallback']
    assert generate.call_args_list[0].kwargs['contents'][0] == generate.call_args_list[1].kwargs['contents'][0]


@pytest.mark.parametrize('outcome,status', [
    (ai.errors.APIError(429, {'message': 'quota'}), 503),
    (ai.errors.APIError(503, {'message': 'down'}), 502),
    (TimeoutError(), 504),
    (SimpleNamespace(text='{}'), 422),
])
def test_all_models_fail(client, monkeypatch, outcome, status):
    generate = mock_provider(monkeypatch, [outcome, outcome])
    result = client.post('/api/ai/scan-label', files={'file': ('x.png', image_bytes(), 'image/png')})
    assert result.status_code == status
    assert generate.await_count == 2


@pytest.mark.parametrize('code', [400, 401, 403])
def test_no_retry_for_invalid_request_or_credentials(client, monkeypatch, code):
    generate = mock_provider(monkeypatch, [ai.errors.APIError(code, {'message': 'rejected'})])
    result = client.post('/api/ai/scan-label', files={'file': ('x.png', image_bytes(), 'image/png')})
    assert result.status_code == 502
    assert generate.await_count == 1


@pytest.mark.parametrize('data', [b'', b'not an image', image_bytes('GIF'), b'x' * (ai.MAX_IMAGE_BYTES + 1)], ids=['empty', 'corrupt', 'unsupported', 'oversized'])
def test_invalid_upload_never_calls_provider(client, monkeypatch, data):
    generate = mock_provider(monkeypatch, [])
    result = client.post('/api/ai/scan-label', files={'file': ('x.png', data, 'image/png')})
    assert result.status_code == 400
    generate.assert_not_awaited()


def test_missing_key(client, monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY')
    result = client.post('/api/ai/scan-label', files={'file': ('x.png', image_bytes(), 'image/png')})
    assert result.status_code == 503


def test_requires_authentication(monkeypatch):
    app = FastAPI()
    app.include_router(ai.router)
    assert TestClient(app).post('/api/ai/scan-label', files={'file': ('x.png', image_bytes(), 'image/png')}).status_code == 401


def test_models_are_deduplicated_and_bounded(monkeypatch):
    monkeypatch.setenv('GEMINI_MODEL', ' primary ')
    monkeypatch.setenv('GEMINI_FALLBACK_MODELS', 'primary, fallback, ,third,fourth')
    assert ai.configured_models() == ['primary', 'fallback', 'third']


def test_orientation_and_transparency():
    output = io.BytesIO()
    image = Image.new('RGBA', (32, 24), (0, 0, 0, 0))
    exif = Image.Exif()
    exif[274] = 6
    image.save(output, format='PNG', exif=exif)
    with Image.open(io.BytesIO(ai.normalize_image(output.getvalue()))) as normalized:
        assert normalized.size == (24, 32)
        assert normalized.getpixel((0, 0)) == (255, 255, 255)


def test_total_timeout(client, monkeypatch):
    import asyncio
    async def slow(*args):
        await asyncio.sleep(1)
    monkeypatch.setattr(ai, 'TOTAL_TIMEOUT', 0.01)
    monkeypatch.setattr(ai, 'request_nutrition', slow)
    result = client.post('/api/ai/scan-label', files={'file': ('x.png', image_bytes(), 'image/png')})
    assert result.status_code == 504
