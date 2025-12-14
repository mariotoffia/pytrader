FROM python:3.11-slim

WORKDIR /app/services/analytics

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY services/analytics/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy analytics service code
COPY services/analytics/src ./src
COPY services/analytics/tests ./tests

EXPOSE 4002

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "4002"]
