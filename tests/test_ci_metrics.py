import json
import sys
from types import SimpleNamespace

import pytest

from scripts import ci_metrics


@pytest.mark.parametrize('exit_code', [0, 7])
def test_metrics_preserve_command_failure_and_metadata(monkeypatch, tmp_path, exit_code):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv('GITHUB_SHA', 'candidate')
    monkeypatch.setenv('CACHE_MODE', 'uncached')
    monkeypatch.setenv('GITHUB_STEP_SUMMARY', str(tmp_path / 'summary.md'))
    monkeypatch.setattr(sys, 'argv', ['ci_metrics.py', 'test-step', '--', 'example', '--flag'])

    def run(command, check):
        assert command == ['example', '--flag']
        assert check is False
        return SimpleNamespace(returncode=exit_code)

    monkeypatch.setattr(ci_metrics.subprocess, 'run', run)
    assert ci_metrics.main() == exit_code
    record = json.loads((tmp_path / '.ci-metrics/test-step.json').read_text())
    assert record['exit_code'] == exit_code
    assert record['commit'] == 'candidate'
    assert record['cache_mode'] == 'uncached'
    assert record['seconds'] >= 0
