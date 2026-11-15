"""Require healthy MongoDB and the exact expected deployed commit."""
import argparse
import json
import time
from urllib.error import URLError
from urllib.parse import urlparse
from urllib.request import urlopen


def check(url, revision, attempts=30, delay=10):
    if urlparse(url).scheme != 'https' or not revision.strip():
        raise ValueError('Provide an HTTPS health URL and a nonempty expected full commit SHA.')
    for attempt in range(1, attempts + 1):
        try:
            with urlopen(url, timeout=10) as response:
                data = json.load(response)
            if (isinstance(data, dict) and data.get('status') == 'ok'
                    and data.get('database') == 'connected' and data.get('revision') == revision):
                print('Deployment verified: healthy database and expected commit.')
                return True
        except (URLError, TimeoutError, ValueError, OSError):
            pass
        print(f'Health/revision not ready ({attempt}/{attempts}).')
        if attempt < attempts:
            time.sleep(delay)
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--revision', required=True)
    args = parser.parse_args()
    try:
        return 0 if check(args.url, args.revision) else 1
    except ValueError as error:
        parser.error(str(error))


if __name__ == '__main__':
    raise SystemExit(main())
