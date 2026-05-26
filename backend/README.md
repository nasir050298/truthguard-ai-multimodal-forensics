# TruthGuard AI Backend — Option C

This backend gives TruthGuard AI a real Express API gateway with real upload routes, JWT demo authentication, reports, audit logs, model health checks, Socket.IO events, and optional FastAPI AI-service forwarding.

If the Python AI services are offline, the backend safely returns realistic fallback results, so the portfolio project still works.

## Install

```bash
npm install
cp .env.example .env
npm run dev
```

Server:

```text
http://localhost:5000
```

## Build

```bash
npm run build
npm start
```

## Demo Accounts

```text
analyst@truthguard.ai / demo123
reviewer@truthguard.ai / demo123
admin@truthguard.ai / demo123
```

## API Routes

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/image/analyze
POST /api/video/analyze
POST /api/voice/analyze
GET  /api/reports
GET  /api/reports/:id
PATCH /api/reports/:id/review
DELETE /api/reports/:id
GET  /api/models
GET  /api/models/health
GET  /api/audit
POST /api/audit
GET  /api/health
```

## Upload Example

Use multipart/form-data field name `file`.

```ts
const formData = new FormData();
formData.append("file", file);

await fetch("http://localhost:5000/api/image/analyze", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

## Optional FastAPI AI Services

The backend forwards files to:

```text
IMAGE_SERVICE_URL=http://localhost:8001
VIDEO_SERVICE_URL=http://localhost:8002
VOICE_SERVICE_URL=http://localhost:8003
```

Expected endpoint:

```text
POST /analyze
GET  /health
```

If not available, fallback results are returned automatically.
