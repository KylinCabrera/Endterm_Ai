# Same Python version as the CI pipeline
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /code

# Install dependencies first so Docker can cache this layer
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy only the API code (see .dockerignore for what is excluded)
COPY app ./app

# Run as a non-root user
RUN useradd --create-home appuser
USER appuser

# Render provides $PORT; default to 8000 for local runs
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]