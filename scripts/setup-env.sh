#!/usr/bin/env bash
# Shell automated setup script for dsh-zotero-academic

set -e

echo "=== Setting up dsh-zotero-academic environment ==="

# 1. Setup Python virtual environment
if command -v uv >/dev/null 2>&1; then
    echo "[1/3] Found 'uv'. Creating venv and installing Python dependencies..."
    if [ ! -d ".venv" ]; then
        uv venv .venv --python 3.12
    fi
    uv pip install -e .
else
    echo "[1/3] 'uv' not found. Using system python..."
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -e .
fi

# 2. Install Node.js dependencies
echo "[2/3] Installing Node.js dependencies..."
npm install

# 3. Build project
echo "[3/3] Compiling TypeScript host and browser client bundle..."
npm run build

echo ""
echo "=== Setup Complete! ==="
echo "Load into DeepSeek Harness via:"
echo "  pnpm dsh web --patch cordis.yml"
