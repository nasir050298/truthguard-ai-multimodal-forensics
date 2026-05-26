# TruthGuard AI Real Image Detection Service

This FastAPI service connects the TruthGuard AI backend with a real Hugging Face image deepfake detection model.

Default model:

```text
dima806/deepfake_vs_real_image_detection
```

## Run on Windows PowerShell

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python main.py
```

Service URL:

```text
http://localhost:8001
```

Health check:

```text
http://localhost:8001/health
```

## Backend connection

In the TruthGuard backend `.env`, keep:

```env
IMAGE_SERVICE_URL=http://localhost:8001
```

Restart backend:

```powershell
npm run dev
```

Then run image analysis from frontend. The backend response should show:

```json
"aiServiceUsed": true,
"fallbackUsed": false
```
