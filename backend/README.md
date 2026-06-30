# GovFlow Backend

Node.js + Express + MongoDB backend for GovFlow.  
Implements the domain API contract in `gov-flow-ui-files-ref/docs/API_CONTRACT.md` so the frontend can call real HTTP endpoints instead of Base44/mock.

## Quick start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env if needed (default port 4000, local MongoDB)
```

### 3. Start MongoDB  
Option A – local install:
```bash
mongod --dbpath /usr/local/var/mongodb   # macOS Homebrew
```
Option B – Docker (no install needed):
```bash
docker run -d -p 27017:27017 --name govflow-mongo mongo:7
```

### 4. Run the dev server
```bash
npm run dev
```
Server starts on **http://localhost:4000** with hot reload via nodemon.

## Endpoints (so far)

| Method | Path         | Description                          |
|--------|--------------|--------------------------------------|
| GET    | `/health`    | Server + MongoDB status              |

More routes are added in subsequent todos (auth, tasks, users, email, etc.).

## Project structure

```
backend/
├── src/
│   ├── server.js           # Entry point: connects DB and starts HTTP server
│   ├── app.js              # Express app, middleware, route mounting
│   ├── config/
│   │   └── index.js        # Environment config (port, mongoUri, jwtSecret, …)
│   ├── lib/
│   │   ├── db.js           # Mongoose connection helper
│   │   └── logger.js       # Structured JSON logger
│   ├── middleware/
│   │   └── errorHandler.js # Global error handler + asyncHandler helper
│   ├── routes/
│   │   └── healthRoutes.js # GET /health
│   ├── controllers/        # (todo 3 – auth/RBAC + todo 4 – domain routes)
│   ├── services/           # (todo 4 – business logic)
│   └── models/             # (todo 2 – Mongoose schemas)
├── .env                    # Local dev environment (not committed)
├── .env.example            # Template for teammates
└── package.json
```

## Environment variables

| Variable           | Default                                     | Purpose                                  |
|--------------------|---------------------------------------------|------------------------------------------|
| `PORT`             | `4000`                                      | HTTP server port                         |
| `MONGO_URI`        | `mongodb://localhost:27017/govflow_dev`     | MongoDB connection string                |
| `JWT_SECRET`       | `govflow-dev-secret-change-in-prod`         | Signs dev tokens (change in staging/prod)|
| `DEFAULT_TENANT_ID`| `default`                                   | Tenant identifier                        |
| `UPLOADS_DIR`      | `./uploads`                                 | Local file upload directory (dev fallback) |
| `UPLOADS_MAX_SIZE` | `5242880` (5 MB)                            | Max avatar upload size in bytes            |
| `STORAGE_PROVIDER` | `local`                                     | Set to `r2` when using Cloudflare R2       |
| `S3_BUCKET`        | —                                           | R2/S3 bucket name                          |
| `S3_REGION`        | `auto`                                      | R2 uses `auto`                             |
| `S3_ENDPOINT`      | —                                           | e.g. `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | —                                           | R2 API token access key                    |
| `S3_SECRET_ACCESS_KEY` | —                                       | R2 API token secret                        |
| `S3_PUBLIC_BASE_URL` | —                                         | Public bucket URL, e.g. `https://pub-xxx.r2.dev` |
| `CORS_ORIGINS`     | `http://localhost:5173,http://localhost:5174`| Allowed frontend origins                 |

## Development notes

- **Mongo not running?** The server starts anyway in `NODE_ENV=development` and the `/health` endpoint reports `"db":"disconnected"`. Data endpoints will fail until Mongo is up.
- **Dev auth**: pass `X-User-Id` (for example `user1`) in requests. `attachUser` resolves this user from Mongo and `requireAuth`/`requireRole` enforce route access.
