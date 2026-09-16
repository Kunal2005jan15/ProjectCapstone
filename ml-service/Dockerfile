FROM python:3.11-slim

WORKDIR /app

# System deps for Prophet (needs a C++ compiler for cmdstan on first install)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
# models_store/ must contain trained .joblib files before building this
# image — run `python -m app.modeling.save_model` locally first. Training
# inside the container on every build is possible but slow; this keeps
# build vs. train as separate, deliberate steps.
COPY models_store/ ./models_store/

EXPOSE 8000

# Fails fast if the service can't even import — better than a slow, silent
# container that "runs" but never actually serves traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.inference.serve_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
