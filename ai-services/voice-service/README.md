# TruthGuard AI Real Voice Detection Service

This FastAPI service connects the TruthGuard AI backend with a real Hugging Face audio/voice deepfake detection model.

Default model:

```text
Sara1708/deepfake-audio-wav2vec2
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
http://localhost:8003
```

Health check:

```text
http://localhost:8003/health
```

Analyze endpoint:

```text
POST http://localhost:8003/analyze
multipart/form-data field: file
```

## Backend connection

In the TruthGuard backend `.env`, keep:

```env
VOICE_SERVICE_URL=http://localhost:8003
```

Restart backend:

```powershell
npm run dev
```

After this, voice analysis response should show:

```json
"aiServiceUsed": true,
"fallbackUsed": false
```
