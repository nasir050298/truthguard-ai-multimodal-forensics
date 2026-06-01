import io
import os
import tempfile
import time
from typing import Any, Dict, List, Tuple

import librosa
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

MODEL_ID = os.getenv("VOICE_MODEL_ID", "Sara1708/deepfake-audio-wav2vec2")
HOST = os.getenv("VOICE_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("VOICE_SERVICE_PORT", "8003"))
TARGET_SAMPLE_RATE = 16000
MAX_DURATION_SECONDS = 30

app = FastAPI(
    title="TruthGuard AI Voice Detection Service",
    description="Real Hugging Face audio deepfake detection service for TruthGuard AI.",
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
        device = 0 if torch.cuda.is_available() else -1
        classifier = pipeline("audio-classification",
                              model=MODEL_ID, device=device)
        model_load_error = None
        return classifier
    except Exception as exc:
        model_load_error = str(exc)
        raise


@app.on_event("startup")
def startup_event():
    try:
        load_model()
        print(f"Loaded voice model: {MODEL_ID}")
    except Exception as exc:
        print(f"Failed to load voice model: {exc}")


@app.get("/health")
def health():
    return {
        "status": "ok" if classifier is not None else "model_not_loaded",
        "service": "truthguard-voice-service",
        "model": MODEL_ID,
        "modelLoaded": classifier is not None,
        "modelLoadError": model_load_error,
        "cudaAvailable": torch.cuda.is_available(),
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    started = time.time()
    raw = await file.read()
    try:
        audio, sample_rate = load_audio_from_bytes(raw)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Could not decode audio. Try WAV/MP3/FLAC/OGG/M4A. Error: {exc}")
    if audio.size == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty.")
    audio = preprocess_audio(audio, sample_rate)
    try:
        clf = load_model()
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail=f"Voice model is not available: {exc}")
    predictions = clf(
        {"array": audio, "sampling_rate": TARGET_SAMPLE_RATE}, top_k=None)
    normalized = normalize_predictions(predictions)
    fake_score, real_score, top_label = extract_fake_real_scores(normalized)
    confidence = round(max(fake_score, real_score))
    is_fake = fake_score >= real_score
    risk = risk_from_score(fake_score)
    if is_fake and fake_score >= 70:
        verdict = "Synthetic voice probability elevated"
    elif is_fake:
        verdict = "Possible synthetic voice artifacts"
    else:
        verdict = "Likely authentic voice"
    audio_features = compute_audio_features(
        audio, TARGET_SAMPLE_RATE, fake_score)
    timeline = build_audio_timeline(audio, TARGET_SAMPLE_RATE, fake_score)
    segments = build_suspicious_segments(timeline)
    elapsed_ms = round((time.time() - started) * 1000)
    return {
        "verdict": verdict,
        "confidence": confidence,
        "risk": risk,
        "label": top_label,
        "scores": {
            "fakeProbability": round(fake_score, 2),
            "realProbability": round(real_score, 2),
            "syntheticProbability": round(fake_score, 2),
            "modelTopLabel": top_label,
            "modelPredictions": normalized,
            "replayAttackScore": audio_features["replayAttackScore"],
            "voiceprintMismatch": audio_features["voiceprintMismatch"],
            "spectralArtifactScore": audio_features["spectralArtifactScore"],
            "pitchStability": audio_features["pitchStability"],
            "zeroCrossingRate": audio_features["zeroCrossingRate"],
            "rmsEnergyShift": audio_features["rmsEnergyShift"],
            "durationSeconds": audio_features["durationSeconds"],
            "sampleRate": TARGET_SAMPLE_RATE,
            "inferenceTimeMs": elapsed_ms,
            "modelId": MODEL_ID,
        },
        "timeline": timeline,
        "segments": segments,
    }


def load_audio_from_bytes(raw: bytes) -> Tuple[np.ndarray, int]:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp:
        tmp.write(raw)
        tmp_path = tmp.name
    try:
        audio, sample_rate = librosa.load(tmp_path, sr=None, mono=True)
        return audio.astype(np.float32), int(sample_rate)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


def preprocess_audio(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    if sample_rate != TARGET_SAMPLE_RATE:
        audio = librosa.resample(
            audio, orig_sr=sample_rate, target_sr=TARGET_SAMPLE_RATE)
    max_samples = TARGET_SAMPLE_RATE * MAX_DURATION_SECONDS
    if len(audio) > max_samples:
        audio = audio[:max_samples]
    peak = np.max(np.abs(audio)) if len(audio) else 0
    if peak > 0:
        audio = audio / peak
    return audio.astype(np.float32)


def normalize_predictions(predictions: Any) -> List[Dict[str, Any]]:
    if isinstance(predictions, dict):
        predictions = [predictions]
    if not isinstance(predictions, list):
        return []
    output = []
    for item in predictions:
        label = str(item.get("label", "unknown"))
        score = float(item.get("score", 0.0))
        output.append({"label": label, "score": round(score, 6),
                      "percentage": round(score * 100, 2)})
    return sorted(output, key=lambda item: item["score"], reverse=True)


def extract_fake_real_scores(predictions: List[Dict[str, Any]]):
    fake_score = None
    real_score = None
    top_label = predictions[0]["label"] if predictions else "unknown"

    for item in predictions:
        label = item["label"].lower()
        percentage = float(item["percentage"])

        if any(word in label for word in ["fake", "spoof", "synthetic", "deepfake", "ai"]):
            fake_score = percentage

        if any(word in label for word in ["real", "genuine", "authentic", "bonafide", "human"]):
            if "fake" not in label:
                real_score = percentage

    if fake_score is None and real_score is None and predictions:
        top = predictions[0]
        second = predictions[1] if len(predictions) > 1 else {
            "percentage": 100 - float(top["percentage"])
        }

        label = top["label"].lower()

        if "real" in label or "bonafide" in label or "genuine" in label or "authentic" in label:
            real_score = float(top["percentage"])
            fake_score = float(second["percentage"])

        elif "fake" in label or "spoof" in label or "synthetic" in label or "deepfake" in label:
            fake_score = float(top["percentage"])
            real_score = float(second["percentage"])

        else:
            # Unknown labels such as LABEL_0 / LABEL_1.
            # Keep conservative mapping but do not overwrite known real/fake labels.
            fake_score = float(top["percentage"])
            real_score = float(second["percentage"])

    if real_score is None and fake_score is not None:
        real_score = max(0.0, 100.0 - fake_score)

    if fake_score is None and real_score is not None:
        fake_score = max(0.0, 100.0 - real_score)

    if fake_score is None:
        fake_score = 0.0

    if real_score is None:
        real_score = 0.0

    return fake_score, real_score, top_label


def risk_from_score(fake_score: float):
    if fake_score >= 92:
        return "Critical"
    if fake_score >= 80:
        return "High"
    if fake_score >= 60:
        return "Medium"
    return "Low"


def compute_audio_features(audio: np.ndarray, sample_rate: int, fake_score: float):
    duration = len(audio) / sample_rate
    rms = librosa.feature.rms(y=audio)[0]
    zcr = librosa.feature.zero_crossing_rate(audio)[0]
    spectral_centroid = librosa.feature.spectral_centroid(
        y=audio, sr=sample_rate)[0]
    spectral_bandwidth = librosa.feature.spectral_bandwidth(
        y=audio, sr=sample_rate)[0]
    try:
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sample_rate)
        pitch_values = pitches[magnitudes > np.percentile(magnitudes, 90)]
        pitch_std = float(np.std(pitch_values)) if pitch_values.size else 0.0
    except Exception:
        pitch_std = 0.0
    rms_shift = float(np.std(rms) * 1000) if rms.size else 0.0
    zcr_score = float(np.mean(zcr) * 100) if zcr.size else 0.0
    spectral_std = float(np.std(spectral_centroid) /
                         50) if spectral_centroid.size else 0.0
    bandwidth_std = float(np.std(spectral_bandwidth) /
                          50) if spectral_bandwidth.size else 0.0
    pitch_stability = clamp(100 - min(100, pitch_std / 6))
    replay_attack = clamp((fake_score * 0.45) +
                          (zcr_score * 0.35) + (rms_shift * 0.2))
    voiceprint_mismatch = clamp((fake_score * 0.55) + (spectral_std * 0.45))
    spectral_artifact = clamp(
        (fake_score * 0.5) + (spectral_std * 0.25) + (bandwidth_std * 0.25))
    rms_energy_shift = clamp(rms_shift)
    return {
        "replayAttackScore": round(replay_attack, 2),
        "voiceprintMismatch": round(voiceprint_mismatch, 2),
        "spectralArtifactScore": round(spectral_artifact, 2),
        "pitchStability": round(pitch_stability, 2),
        "zeroCrossingRate": round(clamp(zcr_score), 2),
        "rmsEnergyShift": round(rms_energy_shift, 2),
        "durationSeconds": round(duration, 2),
    }


def build_audio_timeline(audio: np.ndarray, sample_rate: int, fake_score: float):
    duration = len(audio) / sample_rate
    if duration <= 0:
        return []
    window_seconds = 5
    window_samples = window_seconds * sample_rate
    timeline = []
    total_windows = max(1, int(np.ceil(len(audio) / window_samples)))
    for index in range(total_windows):
        start = index * window_samples
        end = min(len(audio), (index + 1) * window_samples)
        chunk = audio[start:end]
        if chunk.size == 0:
            continue
        rms = float(np.mean(librosa.feature.rms(y=chunk)[0]) * 100)
        zcr = float(
            np.mean(librosa.feature.zero_crossing_rate(chunk)[0]) * 100)
        local_risk = clamp((fake_score * 0.65) + (rms * 0.15) + (zcr * 0.2))
        timeline.append(
            {"time": f"{int(index * window_seconds)}s", "risk": round(local_risk, 2)})
    return timeline


def build_suspicious_segments(timeline: List[Dict[str, Any]]):
    segments = []
    for index, item in enumerate(timeline):
        risk = float(item["risk"])
        if risk >= 80:
            level = "Critical"
        elif risk >= 65:
            level = "High"
        elif risk >= 50:
            level = "Medium"
        else:
            continue
        start_seconds = index * 5
        end_seconds = start_seconds + 5
        segments.append({"start": f"00:{start_seconds:02d}",
                        "end": f"00:{end_seconds:02d}", "risk": level})
    return segments


def clamp(value: float):
    return max(1.0, min(99.0, float(value)))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
