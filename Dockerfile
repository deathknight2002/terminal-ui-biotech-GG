# Multi-stage Dockerfile for Biotech Terminal Platform
# Builds both Python backend and Node.js frontend in a single container

# Stage 1: Build Node.js frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY frontend-components/package*.json ./frontend-components/
COPY terminal/package*.json ./terminal/
COPY examples/package*.json ./examples/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code
COPY frontend-components ./frontend-components
COPY terminal ./terminal
COPY examples ./examples
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./

# Build frontend components and terminal app
RUN npm run build:components
RUN npm run build:terminal

# Stage 2: Build Python backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy Python dependencies
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev dependencies)
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy Python source
COPY bt_platform ./bt_platform
COPY scripts ./scripts
COPY data ./data

# Stage 3: Production runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --from=backend-builder /app/bt_platform ./bt_platform
COPY --from=backend-builder /app/scripts ./scripts
COPY --from=backend-builder /app/data ./data

# Copy built frontend
COPY --from=frontend-builder /app/terminal/dist ./terminal/dist
COPY --from=frontend-builder /app/frontend-components/dist ./frontend-components/dist

# Create necessary directories
RUN mkdir -p /app/data /app/logs

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "bt_platform.core.app:app", "--host", "0.0.0.0", "--port", "8000"]
