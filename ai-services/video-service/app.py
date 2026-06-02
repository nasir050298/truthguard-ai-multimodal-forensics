import os
import uuid
import shutil
import cv2
import torch
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8002))

app = FastAPI(title="TruthGuard Video Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
FRAME_DIR = "extracted_frames"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(FRAME_DIR, exist_ok=True)

MODEL_ID = "dima806/deepfake_vs_real_image_detection"

classifier = None
model_loaded = False
model_error = None

try:
    classifier = pipeline(
        "image-classification",
        model=MODEL_ID,
        device=0 if torch.cuda.is_available() else -1
    )
    model_loaded = True
except Exception as e:
    model_error = str(e)


@app.get("/")
def root():
    return {
        "service": "truthguard-video-service",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok" if model_loaded else "model_not_loaded",
        "service": "truthguard-video-service",
        "model": MODEL_ID,
        "modelLoaded": model_loaded,
        "modelLoadError": model_error,
        "cudaAvailable": torch.cuda.is_available()
    }


def extract_frames(video_path, output_folder, frame_skip=30):
    cap = cv2.VideoCapture(video_path)

    frame_paths = []
    count = 0
    saved = 0

    while True:
        success, frame = cap.read()

        if not success:
            break

        if count % frame_skip == 0:
            frame_name = f"frame_{saved}.jpg"
            frame_path = os.path.join(output_folder, frame_name)

            cv2.imwrite(frame_path, frame)

            frame_paths.append(frame_path)
            saved += 1

        count += 1

    cap.release()

    return frame_paths


@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    if not model_loaded:
        return {
            "success": False,
            "message": "Model not loaded",
            "error": model_error
        }

    video_id = str(uuid.uuid4())

    video_path = os.path.join(
        TEMP_DIR,
        f"{video_id}_{file.filename}"
    )

    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    output_folder = os.path.join(FRAME_DIR, video_id)

    os.makedirs(output_folder, exist_ok=True)

    frame_paths = extract_frames(video_path, output_folder)

    if len(frame_paths) == 0:
        return {
            "success": False,
            "message": "No frames extracted"
        }

    fake_scores = []
    frame_results = []

    for frame_path in frame_paths:
        try:
            image = Image.open(frame_path)

            predictions = classifier(image)

            real_score = 0
            fake_score = 0

            for pred in predictions:
                label = pred["label"].lower()

                if "real" in label:
                    real_score = pred["score"]

                if "fake" in label:
                    fake_score = pred["score"]

            fake_percent = round(fake_score * 100, 2)

            fake_scores.append(fake_percent)

            frame_results.append({
                "frame": os.path.basename(frame_path),
                "fakeProbability": fake_percent
            })

        except Exception as e:
            frame_results.append({
                "frame": os.path.basename(frame_path),
                "error": str(e)
            })

    average_fake = round(sum(fake_scores) / len(fake_scores), 2)

    verdict = (
        "Potential deepfake video"
        if average_fake >= 50
        else "Likely authentic video"
    )

    risk = (
        "High"
        if average_fake >= 75
        else "Medium"
        if average_fake >= 50
        else "Low"
    )

    return {
        "success": True,
        "message": "Video analysis completed",
        "data": {
            "verdict": verdict,
            "confidence": average_fake,
            "risk": risk,
            "framesAnalyzed": len(frame_paths),
            "fakeFrameRatio": round(
                len([x for x in fake_scores if x >= 50]) / len(fake_scores),
                2
            ),
            "model": MODEL_ID,
            "timeline": frame_results
        }
    }
