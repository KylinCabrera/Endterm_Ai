"""Shared, atomic scan-attempt limits. MongoDB failure never permits an AI call."""
import os
import time
from datetime import datetime, timezone

from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.database import get_database


def scan_limits():
    try:
        values = tuple(int(os.getenv(name, default)) for name, default in (
            ('AI_SCANS_PER_MINUTE', '5'),
            ('AI_SCANS_PER_DAY', '50'),
            ('AI_GLOBAL_SCANS_PER_DAY', '500'),
        ))
        if any(value < 1 for value in values):
            raise ValueError
        return values
    except ValueError:
        raise HTTPException(503, 'AI usage limits are misconfigured on the backend.')


async def reserve_scan(user_id):
    """Reserve before contacting Gemini; failed provider calls also consume attempts.

    Conditional upserts plus MongoDB's unique _id index prevent concurrent callers
    from exceeding a bucket. DuplicateKeyError means that bucket is already full.
    Earlier reservations are intentionally not refunded if a later bucket is full.
    """
    minute_limit, day_limit, global_limit = scan_limits()
    now = int(time.time())
    collection = get_database().ai_usage
    for scope, seconds, limit, message in (
        (f'user:{user_id}:minute', 60, minute_limit, 'Too many scans. Please wait before trying again.'),
        (f'user:{user_id}:day', 86400, day_limit, 'Your daily scan limit was reached. Try again tomorrow (UTC).'),
        ('global:day', 86400, global_limit, 'The daily scanning allowance was reached. Try again tomorrow (UTC).'),
    ):
        bucket = now // seconds
        reset = (bucket + 1) * seconds
        try:
            await collection.update_one(
                {'_id': f'{scope}:{bucket}', 'count': {'$lt': limit}},
                {'$inc': {'count': 1}, '$setOnInsert': {
                    'expires_at': datetime.fromtimestamp(reset + 86400, timezone.utc),
                }},
                upsert=True,
            )
        except DuplicateKeyError:
            raise HTTPException(429, message, headers={'Retry-After': str(reset - now)})
        except PyMongoError:
            raise HTTPException(503, 'Cannot verify the scanning allowance. Please try again later.')
