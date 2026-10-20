# Multi-stage Dockerfile for SENTINEL-Drone C-UAS Simulator
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . /app

# Ensure database directory and permissions
EXPOSE 3000

ENV PORT=3000
ENV PYTHONUNBUFFERED=1

CMD ["python", "server.py"]
