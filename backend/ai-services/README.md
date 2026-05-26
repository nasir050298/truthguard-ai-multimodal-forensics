# Optional FastAPI AI Service Stubs
Run these only if you want to test service forwarding. The Express backend works without them by returning fallback results.

```bash
pip install -r requirements.txt
uvicorn image-service.main:app --host 0.0.0.0 --port 8001
uvicorn video-service.main:app --host 0.0.0.0 --port 8002
uvicorn voice-service.main:app --host 0.0.0.0 --port 8003
```
