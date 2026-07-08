FROM python:3.11-slim

WORKDIR /srv

COPY api/requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY api/app/ ./app/
COPY api/tests/ ./tests/
COPY api/pyproject.toml .
COPY data/processed/models/hybrid_artifacts.pkl ./data/models/hybrid_artifacts.pkl

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
