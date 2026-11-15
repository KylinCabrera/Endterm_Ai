"""Never send telemetry from automated tests, even with a local .env file."""
import os

os.environ['SENTRY_DSN'] = ''
