import io
import json
from unittest.mock import MagicMock

from scripts.check_deployment import check


def test_old_healthy_deployment_does_not_pass(monkeypatch):
    old = {'status': 'ok', 'database': 'connected', 'revision': 'old'}
    current = {**old, 'revision': 'new'}
    responses = [io.StringIO(json.dumps(data)) for data in (old, current)]
    fetch = MagicMock(side_effect=responses)
    monkeypatch.setattr('scripts.check_deployment.urlopen', fetch)
    assert check('https://example.com/health', 'new', attempts=2, delay=0)
    assert fetch.call_count == 2


def test_database_failure_and_invalid_response_fail(monkeypatch):
    for data in ({'status': 'ok', 'database': 'offline', 'revision': 'new'}, []):
        monkeypatch.setattr('scripts.check_deployment.urlopen', lambda *a, **k: io.StringIO(json.dumps(data)))
        assert not check('https://example.com/health', 'new', attempts=1)
