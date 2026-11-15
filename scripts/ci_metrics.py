"""Time a CI command without suppressing its output or failure status."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('name')
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        parser.error('A command is required after --')
    started = time.perf_counter()
    result = subprocess.run(command, check=False)
    record = {
        'step': args.name, 'seconds': round(time.perf_counter() - started, 3),
        'exit_code': result.returncode, 'commit': os.getenv('GITHUB_SHA', 'local'),
        'run_id': os.getenv('GITHUB_RUN_ID', 'local'),
        'cache_mode': os.getenv('CACHE_MODE', 'local'),
        'runner': os.getenv('RUNNER_OS', os.name),
    }
    folder = Path('.ci-metrics')
    folder.mkdir(exist_ok=True)
    (folder / f'{args.name}.json').write_text(json.dumps(record, indent=2) + '\n')
    if summary := os.getenv('GITHUB_STEP_SUMMARY'):
        with open(summary, 'a', encoding='utf-8') as stream:
            stream.write(f"- {args.name}: **{record['seconds']} s**, exit {result.returncode}, cache {record['cache_mode']}\n")
    return result.returncode


if __name__ == '__main__':
    raise SystemExit(main())
