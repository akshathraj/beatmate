FROM python:3.11-slim

# Install system dependencies AND fonts
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Fix ImageMagick security policy (find the actual path and fix it)
RUN POLICY_FILE=$(find /etc -name "policy.xml" 2>/dev/null | grep -i imagemagick | head -n 1) && \
    if [ -n "$POLICY_FILE" ]; then \
        sed -i 's/rights="none" pattern="TEXT"/rights="read|write" pattern="TEXT"/' "$POLICY_FILE" || true; \
        sed -i 's/rights="none" pattern="LABEL"/rights="read|write" pattern="LABEL"/' "$POLICY_FILE" || true; \
        sed -i 's/rights="none" pattern="@\*"/rights="read|write" pattern="@*"/' "$POLICY_FILE" || true; \
        echo "ImageMagick policy updated at $POLICY_FILE"; \
    else \
        echo "ImageMagick policy file not found, skipping"; \
    fi

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Start command
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]