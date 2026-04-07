# Architecture

## Components

- `frontend/`: React/Next.js 用户界面
- `backend/`: FastAPI 数据服务
- `adapters/`: 上游研究项目只读适配
- `data/demo/`: 演示模式副本

## Data flow

1. 前端只请求 `backend` 提供的 `/api/*`
2. 后端只通过 `repository` 读取 `demo` 数据或上游目录
3. 上游研究仓库保持只读，不被当前项目修改

