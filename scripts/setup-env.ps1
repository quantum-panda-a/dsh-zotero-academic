# PowerShell automated setup script for dsh-zotero-academic

Write-Host "=== Setting up dsh-zotero-academic environment ===" -ForegroundColor Cyan

# 1. Check or install Python dependencies via uv or standard python
if (Get-Command uv -ErrorAction SilentlyContinue) {
    Write-Host "[1/3] Found 'uv'. Creating venv and installing Python dependencies..." -ForegroundColor Green
    if (-not (Test-Path ".venv")) {
        uv venv .venv --python 3.12
    }
    uv pip install -e .
} else {
    Write-Host "[1/3] 'uv' not found. Using system python to create virtual environment..." -ForegroundColor Yellow
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
    }
    .\.venv\Scripts\python.exe -m pip install --upgrade pip
    .\.venv\Scripts\python.exe -m pip install -e .
}

# 2. Install Node.js dependencies
Write-Host "[2/3] Installing Node.js dependencies..." -ForegroundColor Green
npm install

# 3. Build host and client bundles
Write-Host "[3/3] Compiling TypeScript host and browser client bundle..." -ForegroundColor Green
npm run build

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host "You can now load the plugin into DeepSeek Harness via:"
Write-Host "  pnpm dsh web --patch cordis.yml`n" -ForegroundColor Yellow
