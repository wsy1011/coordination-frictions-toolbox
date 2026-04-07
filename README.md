# Lock-Side Coordination Frictions Demo

An interactive bilingual policy sandbox for the paper on lock-side coordination frictions, connected spillovers, and fixed-budget governance designs.

This repository is a standalone demo website. It is intentionally separated from the upstream research repository and only uses aggregate demo snapshots or read-only data adapters. It does not publish event-level lock-passage records.

## Live Demo

If GitHub Pages is enabled for this repository, the static demo is available at:

[https://wsy1011.github.io/coordination-frictions-toolbox/](https://wsy1011.github.io/coordination-frictions-toolbox/)

## Author

Suyang Wang

- Affiliation: Hohai University
- Location: Nanjing, China
- Email: [wangsuyang@hhu.edu.cn](mailto:wangsuyang@hhu.edu.cn)
- GitHub: [github.com/wsy1011](https://github.com/wsy1011)
- ResearchGate: [researchgate.net/profile/Suyang-Wang-6](https://www.researchgate.net/profile/Suyang-Wang-6)
- ORCID: [0009-0002-8499-1181](https://orcid.org/0009-0002-8499-1181)

## What This Demo Does

- Shows a connected lock network with observed lock locations on a real map.
- Provides a bilingual English/Chinese frontend.
- Compares fixed-budget governance designs in a policy sandbox.
- Supports queue-policy and structural-reallocation policy objects.
- Shows targeting indices and lock-level pre-dispatch waiting changes.
- Supports static GitHub Pages deployment using exported JSON snapshots.

## What This Demo Does Not Do

- It does not expose event-level raw lock-passage data.
- It does not provide real-time dispatching or operational scheduling.
- It does not modify the upstream research project.
- It does not re-estimate the paper's empirical specification inside the browser.

## Repository Structure

```text
coordination-frictions-toolbox/
  adapters/                 # Data sync and static-payload export scripts
  backend/                  # FastAPI backend for local demo/private mode
  data/demo/                # Demo snapshots and aggregate data
  docs/                     # Project notes and documentation
  exports/                  # Local exports and logs
  frontend/                 # Next.js frontend
  .github/workflows/        # GitHub Pages deployment workflow
```

## Local Development

### 1. Start the backend

```powershell
cd D:\Code\coordination-frictions-toolbox
Copy-Item .env.example .env
python -m venv .venv
.venv\Scripts\python -m pip install -r backend\requirements.txt
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The health check should be available at:

[http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 2. Start the frontend

```powershell
cd D:\Code\coordination-frictions-toolbox\frontend
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
npm install
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Open:

[http://127.0.0.1:3001](http://127.0.0.1:3001)

## Static GitHub Pages Deployment

GitHub Pages only serves static files, so the demo uses a static-snapshot mode instead of running FastAPI on GitHub.

### 1. Export static data payloads

```powershell
cd D:\Code\coordination-frictions-toolbox
.venv\Scripts\python adapters\export_static_payloads.py
```

This generates static JSON files under:

```text
frontend/public/data/
```

### 2. Build the static frontend locally

```powershell
cd D:\Code\coordination-frictions-toolbox\frontend
$env:NEXT_PUBLIC_STATIC_MODE="true"
$env:STATIC_EXPORT="true"
$env:GITHUB_REPO_NAME="coordination-frictions-toolbox"
$env:NEXT_PUBLIC_BASE_PATH="/coordination-frictions-toolbox"
npm install
npm run build
```

The static output is written to:

```text
frontend/out/
```

### 3. Deploy with GitHub Actions

This repository includes:

[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

To enable deployment:

1. Push to the `main` branch.
2. Go to `Settings -> Pages` in the GitHub repository.
3. Set `Build and deployment` to `GitHub Actions`.
4. Re-run the `Deploy GitHub Pages` workflow if needed.

## Runtime Modes

The main environment variables are:

```text
APP_MODE=demo|private
SOURCE_PROJECT_DIR=<read-only upstream research project path>
PRIVATE_DATA_DIR=<restricted local/private data directory>
MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
MIN_DISCLOSURE_THRESHOLD=10
NEXT_PUBLIC_STATIC_MODE=true|false
NEXT_PUBLIC_BASE_PATH=/coordination-frictions-toolbox
```

`demo` mode uses aggregate demo data and static snapshots. `private` mode is intended for local or intranet use with restricted data directories and should remain read-only with respect to upstream research assets.

## Data Boundary

The public repository is designed for method communication and interface demonstration. It may contain demo snapshots and aggregate outputs, but it should not contain restricted event-level lock-passage data.

For public deployment, use GitHub Pages static mode and avoid committing private raw data, local logs, or restricted exports.

## License

This project uses the MIT License. See [LICENSE](LICENSE).
