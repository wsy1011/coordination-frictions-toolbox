# Coordination Frictions Toolbox Demo

一个独立于原研究仓库的交互式论文演示网站。

- 论文演示 Demo 标题: `船闸协调摩擦政策工具箱 Demo`
- 作者: `Suyang Wang`
- 邮箱: `wangsuyang@hhu.edu.cn`

## 项目定位

这个项目是论文研究的网页化 Demo，用于在真实地图上展示船闸网络、政策参数调节、重点对象识别和聚合结果对比。

它遵循两个原则：

- 不修改上游研究项目中的任何受版本控制文件
- 公开版只展示聚合结果和演示副本，不暴露事件级原始数据

## 目录

- `frontend/`: Next.js 前端
- `backend/`: FastAPI 后端
- `adapters/`: 数据同步与静态快照脚本
- `data/demo/`: Demo 模式使用的数据副本
- `docs/`: 设计与部署文档

## 本地运行

### 1. 启动后端

```powershell
cd D:\Code\coordination-frictions-toolbox
Copy-Item .env.example .env
python -m venv .venv
.venv\Scripts\python -m pip install -r backend\requirements.txt
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 2. 启动前端

```powershell
cd D:\Code\coordination-frictions-toolbox\frontend
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
npm install
npm run dev -- --hostname 127.0.0.1 --port 3001
```

访问 [http://127.0.0.1:3001](http://127.0.0.1:3001)。

## GitHub Pages 静态发布

这套 Demo 可以发布成 GitHub 静态网站，但推荐走“静态快照”模式，而不是把 FastAPI 一起搬到 GitHub Pages。

### 1. 导出静态数据快照

```powershell
cd D:\Code\coordination-frictions-toolbox
.venv\Scripts\python adapters\export_static_payloads.py
```

导出后会生成：

- `frontend/public/data/corridors.json`
- `frontend/public/data/network.json`
- `frontend/public/data/baseline-overview.json`
- `frontend/public/data/rankings.json`
- `frontend/public/data/simulations/*.json`

### 2. 构建静态站点

```powershell
cd D:\Code\coordination-frictions-toolbox\frontend
$env:NEXT_PUBLIC_STATIC_MODE="true"
$env:STATIC_EXPORT="true"
$env:GITHUB_REPO_NAME="<your-repo-name>"
$env:NEXT_PUBLIC_BASE_PATH="/<your-repo-name>"
npm install
npm run build
```

构建产物会输出为可部署到 GitHub Pages 的静态文件。

### 3. 启用自动部署

仓库里已经包含 GitHub Pages 工作流：

- [.github/workflows/deploy-pages.yml](D:/Code/coordination-frictions-toolbox/.github/workflows/deploy-pages.yml)

它会自动完成：

1. 安装 Python 和 Node
2. 导出 `frontend/public/data` 下的静态 JSON 快照
3. 以静态模式构建 Next.js
4. 发布 `frontend/out` 到 GitHub Pages

在 GitHub 上只需要做两步：

1. 把默认分支设为 `main`
2. 进入 `Settings -> Pages`，在 `Build and deployment` 里选择 `GitHub Actions`

之后每次推送到 `main`，GitHub Pages 都会自动更新。

## 运行模式

- `APP_MODE=demo`: 使用 `data/demo/` 中的演示副本
- `APP_MODE=private`: 通过只读方式接入 `PRIVATE_DATA_DIR` 或 `SOURCE_PROJECT_DIR`
- `NEXT_PUBLIC_STATIC_MODE=true`: 前端改为读取 `public/data/*.json` 静态快照

## 说明

- 这个工具用于论文演示和辅助分析，不替代最终政策决策
- 公开 Demo 用于展示方法和交互，不代表受限真实数据上的全部结果
- GitHub Pages 适合发布论文 Demo、地图交互和预计算情景，不适合实时模拟或私有数据访问
