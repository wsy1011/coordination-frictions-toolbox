# Frontend

Next.js 前端，负责政策沙盘、网络地图、重点对象和方法说明四个页面。

## 启动

```powershell
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

默认访问 `http://localhost:3000`。

## 依赖接口

- `GET /api/meta/locks`
- `GET /api/meta/corridors`
- `GET /api/network`
- `GET /api/baseline/overview`
- `POST /api/simulate`
- `GET /api/rankings`
- `POST /api/export/report`

