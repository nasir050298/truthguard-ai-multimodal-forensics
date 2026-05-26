from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="TruthGuard image-service Stub")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
@app.get("/health")
def health(): return {"status":"ok","service":"image-service"}
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    return {"verdict":"AI-generated image artifacts detected","confidence":91,"risk":"High","scores":{"artifactScore":86,"serviceStub":True},"timeline":[{"time":"00:05","risk":24},{"time":"00:15","risk":91}],"segments":[{"start":"00:10","end":"00:18","risk":"High"}]}
