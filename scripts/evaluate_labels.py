"""Opt-in live label evaluation. Never invoked by ordinary CI; never saves carts."""
import argparse
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import time
from urllib.parse import urlparse

import httpx


NUTRIENTS = ('calories', 'protein', 'carbs', 'fat', 'sodium')


def accepts(case, status, data):
    if status != case['expected_status']:
        return False
    if status == 422:
        return True
    if not isinstance(data, dict):
        return False
    expected = case['expected']
    tolerance = case.get('absolute_tolerance', 0.5)
    if type(tolerance) not in (int, float) or not math.isfinite(tolerance) or tolerance < 0:
        return False
    names = case.get('accepted_names', [expected['item_name']])
    if data.get('item_name') not in names:
        return False
    for field in NUTRIENTS:
        value, target = data.get(field), expected[field]
        if target is None:
            if field != 'sodium' or value is not None:
                return False
        elif (type(value) not in (int, float) or not math.isfinite(value)
              or type(target) not in (int, float) or not math.isfinite(target)
              or value < 0 or target < 0 or abs(value - target) > tolerance):
            return False
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--output', default='release-evidence/evaluation.json')
    parser.add_argument('--live', action='store_true', help='Authorize quota-consuming API calls')
    args = parser.parse_args()
    origin = urlparse(args.base_url)
    if (not args.live or origin.scheme != 'https' or not origin.hostname
            or origin.username or origin.password or origin.query or origin.fragment):
        parser.error('Provide --live and an HTTPS backend URL without credentials/query/fragment.')
    token = os.getenv('EVAL_CLERK_TOKEN', '').strip()
    if not token:
        parser.error('Set EVAL_CLERK_TOKEN privately to a current staging Clerk session token.')
    manifest = Path(args.manifest).resolve()
    try:
        cases = json.loads(manifest.read_text(encoding='utf-8'))
        if not isinstance(cases, list) or not cases:
            raise ValueError('The manifest must contain at least one case.')
        ids = set()
        for case in cases:
            if case['id'] in ids or case['expected_status'] not in (200, 422):
                raise ValueError('Use unique case IDs and expected_status 200 or 422.')
            ids.add(case['id'])
            image = manifest.parent / case['image']
            if not image.is_file():
                raise ValueError(f"Missing evaluation image for {case['id']}")
            if case['expected_status'] == 200:
                # Validate expectations and tolerance before making any paid call.
                if not accepts(case, 200, case['expected']):
                    raise ValueError(f"Invalid expected values for {case['id']}")
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.error(str(error))
    results = []
    with httpx.Client(timeout=65, headers={'Authorization': f'Bearer {token}'}) as client:
        for case in cases:
            started = time.perf_counter()
            path = manifest.parent / case['image']
            mime = {'.png': 'image/png', '.webp': 'image/webp'}.get(path.suffix.lower(), 'image/jpeg')
            try:
                with path.open('rb') as image:
                    response = client.post(args.base_url.rstrip('/') + '/api/ai/scan-label',
                                           files={'file': (path.name, image, mime)})
                try:
                    data = response.json()
                except ValueError:
                    data = None
                result = {'id': case['id'], 'status': response.status_code,
                          'output': data, 'passed': accepts(case, response.status_code, data)}
            except httpx.HTTPError:
                result = {'id': case['id'], 'status': None, 'passed': False, 'error': 'Transport failure'}
            result['seconds'] = round(time.perf_counter() - started, 3)
            results.append(result)
            # Respect the default 5/minute allowance; never retry errors automatically.
            if case is not cases[-1]:
                time.sleep(13)
    report = {'recorded_at': datetime.now(timezone.utc).isoformat(),
              'manifest': manifest.name, 'results': results,
              'passed': all(result['passed'] for result in results)}
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(f'Evaluation report written to {output}; passed={report["passed"]}')
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
