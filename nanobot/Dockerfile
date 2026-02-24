FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends iptables iproute2 curl && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir nanobot-ai

WORKDIR /app

COPY config/ ./config/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 18790

ENTRYPOINT ["/entrypoint.sh"]
