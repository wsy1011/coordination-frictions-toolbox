# Connected Lock Pressure Companion

A single-file companion website for the revised paper on connected lock pressure, AIS-visible waiting, pre-dispatch governance burden, grouped CO2 consequence evidence, and fixed-capacity governance targeting.

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

- Uses one self-contained HTML file: `site/index.html`.
- Shows an Apple-style evidence dashboard with inline CSS, inline data, and inline JavaScript.
- Presents the paper's current headline evidence: mean and median pre-dispatch burden, corridor-pressure dispatch-hazard contrast, grouped CO2 consequence evidence, and the fixed-capacity benchmark.
- Presents fixed-capacity governance comparisons as an evidence dashboard.
- Separates direct burden relief from connected-bottleneck supervision as two governance objects.
- Shows targeting indices and a schematic lock-priority network from aggregate table values.
- Supports static GitHub Pages deployment without a Next.js build step.

## What This Demo Does Not Do

- It does not expose event-level raw lock-passage data.
- It does not provide real-time dispatching or operational scheduling.
- It does not modify the upstream research project.
- It does not re-estimate the paper's empirical specification inside the browser.
- It does not treat grouped CO2 evidence as the paper's main causal claim; it is supporting consequence evidence for the connected-pressure diagnosis.
- It does not display paper figure PNGs or manuscript插图.

## Repository Structure

```text
coordination-frictions-toolbox/
  adapters/                 # Data sync and static-payload export scripts
  backend/                  # FastAPI backend for local demo/private mode
  data/demo/                # Demo snapshots and aggregate data
  docs/                     # Project notes and documentation
  exports/                  # Local exports and logs
  site/index.html           # Entire public website in one HTML file
  .github/workflows/        # GitHub Pages deployment workflow
```

## Local Development

The public website is a single static file. Open it directly:

```powershell
cd D:\Code\coordination-frictions-toolbox
Start-Process .\site\index.html
```

The backend remains available for local/private data workflows, but it is not required for the public page.

## Static GitHub Pages Deployment

GitHub Pages serves `site/index.html` directly. No frontend package install or build step is required.

This repository includes:

[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

To enable deployment:

1. Push to the `main` branch.
2. Go to `Settings -> Pages` in the GitHub repository.
3. Set `Build and deployment` to `GitHub Actions`.
4. Re-run the `Deploy GitHub Pages` workflow if needed.

## Runtime Modes

The backend/data-adapter environment variables are:

```text
APP_MODE=demo|private
SOURCE_PROJECT_DIR=<read-only upstream research project path>
PRIVATE_DATA_DIR=<restricted local/private data directory>
MIN_DISCLOSURE_THRESHOLD=10
```

`demo` mode uses aggregate demo data. `private` mode is intended for local or intranet use with restricted data directories and should remain read-only with respect to upstream research assets.

## Data Boundary

The public repository is designed for method communication and interface demonstration. It may contain demo snapshots and aggregate outputs, but it should not contain restricted event-level lock-passage data. The current public framing follows the revised manuscript boundary: AIS-visible waiting and pre-dispatch burden are the main governance objects; grouped CO2 results are supporting consequence evidence; fixed-capacity priority comparisons are transparent benchmarks rather than live operational recommendations.

For public deployment, use GitHub Pages static mode and avoid committing private raw data, local logs, or restricted exports.

## License

This project uses the MIT License. See [LICENSE](LICENSE).
