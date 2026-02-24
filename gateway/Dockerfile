FROM python:3.12-slim

WORKDIR /app

# Install docker CLI
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.3.1.tgz \
    | tar xz --strip-components=1 -C /usr/local/bin docker/docker \
    && apt-get remove -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching)
COPY pyproject.toml .
RUN pip install --no-cache-dir \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "sqlalchemy[asyncio]>=2.0.0" \
    "aiosqlite>=0.20.0" \
    "httpx>=0.27.0" \
    "pydantic-settings>=2.6.0"

COPY src/ ./src/

RUN mkdir -p /data/secrets

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
