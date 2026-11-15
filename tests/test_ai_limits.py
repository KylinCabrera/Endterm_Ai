import asyncio
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pymongo.errors import ConnectionFailure, DuplicateKeyError

from app import ai_limits


def test_shared_limits_and_reset(monkeypatch):
    """Model atomic conditional upserts, including competing users and windows."""
    documents = {}

    async def update(query, change, upsert):
        key = query['_id']
        count = documents.get(key, 0)
        if count >= query['count']['$lt']:
            raise DuplicateKeyError('full bucket')
        documents[key] = count + change['$inc']['count']

    db = AsyncMock()
    db.ai_usage.update_one.side_effect = update
    monkeypatch.setattr(ai_limits, 'get_database', lambda: db)
    monkeypatch.setattr(ai_limits.time, 'time', lambda: 120)
    monkeypatch.setenv('AI_SCANS_PER_MINUTE', '2')
    monkeypatch.setenv('AI_SCANS_PER_DAY', '3')
    monkeypatch.setenv('AI_GLOBAL_SCANS_PER_DAY', '4')

    async def scenario():
        outcomes = await asyncio.gather(
            *(ai_limits.reserve_scan('alice') for _ in range(3)), return_exceptions=True)
        assert sum(outcome is None for outcome in outcomes) == 2
        rejected = next(outcome for outcome in outcomes if isinstance(outcome, HTTPException))
        assert rejected.status_code == 429
        assert rejected.headers == {'Retry-After': '60'}
        monkeypatch.setattr(ai_limits.time, 'time', lambda: 180)
        await ai_limits.reserve_scan('alice')
        with pytest.raises(HTTPException) as daily:
            await ai_limits.reserve_scan('alice')
        assert 'daily' in daily.value.detail
        await ai_limits.reserve_scan('bob')
        with pytest.raises(HTTPException) as global_limit:
            await ai_limits.reserve_scan('bob')
        assert 'allowance' in global_limit.value.detail
        monkeypatch.setattr(ai_limits.time, 'time', lambda: 86400)
        await ai_limits.reserve_scan('alice')

    asyncio.run(scenario())


def test_database_outage_fails_closed(monkeypatch):
    db = AsyncMock()
    db.ai_usage.update_one.side_effect = ConnectionFailure('offline')
    monkeypatch.setattr(ai_limits, 'get_database', lambda: db)
    with pytest.raises(HTTPException) as failure:
        asyncio.run(ai_limits.reserve_scan('alice'))
    assert failure.value.status_code == 503


@pytest.mark.parametrize('value', ['0', '-1', 'bad'])
def test_invalid_limit_configuration(monkeypatch, value):
    monkeypatch.setenv('AI_SCANS_PER_MINUTE', value)
    with pytest.raises(HTTPException):
        ai_limits.scan_limits()
