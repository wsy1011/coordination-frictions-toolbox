# Frontend

Next.js frontend for the connected lock pressure companion site. The frontend serves four public pages:

- policy/evidence dashboard
- connected lock network
- governance priority targets
- method and scope

## Run

```powershell
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Read-only API

- `GET /api/meta/locks`
- `GET /api/meta/corridors`
- `GET /api/network`
- `GET /api/paper/evidence`

The frontend consumes only the revised paper-evidence endpoint and the public network metadata endpoints.
