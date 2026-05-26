import io
import os
import time
from typing import Any, Dict, List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageFilter, ImageOps, ImageStat
from transformers import pipeline

MODEL_ID = os.getenv("IMAGE_MODEL_ID", "dima806/deepfake_vs_real_image_detection")
HOST = os.getenv("IMAGE_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("IMAGE_SERVICE_PORT", "8001"))

app = FastAPI(
    title="TruthGuard AI Image Detection Service",
    description="Real Hugging Face image deepfake detection service for TruthGuard AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = None
model_load_error = None


def load_model():
    global classifier, model_load_error
    if classifier is not None:
        return classifier

    try:
        classifier = pipeline("image-classification", model=MODEL_ID)
        model_load_error = None
        return classifier
    except Exception as exc:
        model_load_error = str(exc)
        raise


@app.on_event("startup")
def startup_event():
    try:
        load_model()
        print(f"Loaded image model: {MODEL_ID}")
    except Exception as exc:
        print(f"Failed to load image model: {exc}")


@app.get("/health")
def health():
    return {
        "status": "ok" if classifier is not None else "model_not_loaded",
        "service": "truthguard-image-service",
        "model": MODEL_ID,
        "modelLoaded": classifier is not None,
        "modelLoadError": model_load_error,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    started = time.time()
    raw = await file.read()

    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        clf = load_model()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Image model is not available: {exc}")

    predictions = clf(image)
    normalized = normalize_predictions(predictions)
    fake_score, real_score, top_label = extract_fake_real_scores(normalized)

    confidence = round(max(fake_score, real_score))
    is_fake = fake_score >= real_score
    risk = risk_from_score(fake_score)

    if is_fake and fake_score >= 70:
        verdict = "AI-generated image likely"
    elif is_fake:
        verdict = "Possible AI-generated image artifacts"
    else:
        verdict = "Likely authentic image"

    artifact_scores = compute_lightweight_artifact_features(image, fake_score)
    elapsed_ms = round((time.time() - started) * 1000)

    return {
        "verdict": verdict,
        "confidence": confidence,
        "risk": risk,
        "label": top_label,
        "scores": {
            "fakeProbability": round(fake_score, 2),
            "realProbability": round(real_score, 2),
            "modelTopLabel": top_label,
            "modelPredictions": normalized,
            "artifactScore": artifact_scores["artifactScore"],
            "edgeComplexity": artifact_scores["edgeComplexity"],
            "colorVariance": artifact_scores["colorVariance"],
            "textureFrequencyMismatch": artifact_scores["textureFrequencyMismatch"],
            "imageWidth": image.width,
            "imageHeight": image.height,
            "inferenceTimeMs": elapsed_ms,
            "modelId": MODEL_ID,
        },
        "timeline": [],
        "segments": [],
    }


def normalize_predictions(predictions: Any) -> List[Dict[str, Any]]:
    if not isinstance(predictions, list):
        return []

    output = []
    for item in predictions:
        label = str(item.get("label", "unknown"))
        score = float(item.get("score", 0.0))
        output.append(
            {
                "label": label,
                "score": round(score, 6),
                "percentage": round(score * 100, 2),
            }
        )

    return sorted(output, key=lambda item: item["score"], reverse=True)


def extract_fake_real_scores(predictions: List[Dict[str, Any]]):
    fake_score = 0.0
    real_score = 0.0
    top_label = predictions[0]["label"] if predictions else "unknown"

    for item in predictions:
        label = item["label"].lower()
        percentage = float(item["percentage"])

        if any(word in label for word in ["fake", "deepfake", "ai", "generated", "synthetic"]):
            fake_score = max(fake_score, percentage)

        if any(word in label for word in ["real", "authentic", "human", "original"]):
            real_score = max(real_score, percentage)

    if fake_score == 0.0 and real_score == 0.0 and predictions:
        top = predictions[0]
        second = predictions[1] if len(predictions) > 1 else {"percentage": 100 - top["percentage"]}
        top_label_lower = top["label"].lower()

        if "label_0" in top_label_lower or top_label_lower in ["0", "class_0"]:
            real_score = float(top["percentage"])
            fake_score = float(second["percentage"])
        else:
            fake_score = float(top["percentage"])
            real_score = float(second["percentage"])

    if fake_score == 0.0 and predictions:
        fake_score = float(predictions[0]["percentage"])

    if real_score == 0.0:
        real_score = max(0.0, 100.0 - fake_score)

    return fake_score, real_score, top_label


def risk_from_score(fake_score: float):
    if fake_score >= 92:
        return "Critical"
    if fake_score >= 80:
        return "High"
    if fake_score >= 60:
        return "Medium"
    return "Low"


def compute_lightweight_artifact_features(image: Image.Image, fake_score: float):
    small = image.resize((224, 224))
    grayscale = ImageOps.grayscale(small)

    edges = grayscale.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges)
    edge_complexity = min(99, round(edge_stat.mean[0] / 2.55, 2))

    color_stat = ImageStat.Stat(small)
    variance = sum(color_stat.var) / len(color_stat.var)
    color_variance = min(99, round(variance / 650, 2))

    texture_frequency = round((edge_complexity * 0.45) + (fake_score * 0.55), 2)
    artifact_score = round((fake_score * 0.7) + (texture_frequency * 0.3), 2)

    return {
        "artifactScore": artifact_score,
        "edgeComplexity": edge_complexity,
        "colorVariance": color_variance,
        "textureFrequencyMismatch": texture_frequency,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
