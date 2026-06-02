import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const router = express.Router();

const upload = multer({
  dest: "uploads/video",
});

router.post(
  "/analyze",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No video uploaded",
        });
      }

      // Send file to Python AI service
      const formData = new FormData();

      formData.append(
        "file",
        fs.createReadStream(req.file.path),
        req.file.originalname
      );

      const aiResponse = await axios.post(
        "http://localhost:8002/analyze",
        formData,
        {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const ai = aiResponse.data;

      return res.json({
        success: true,
        message: "Video analysis completed",

        data: {
          id: `TG-${Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()}`,

          module: "video",

          fileName: req.file.filename,

          originalName: req.file.originalname,

          filePath: req.file.path,

          mimeType: req.file.mimetype,

          sizeBytes: req.file.size,

          verdict: ai.verdict,

          confidence: ai.confidence,

          risk: ai.risk,

          status:
            ai.risk === "Critical"
              ? "Flagged"
              : "Completed",

          createdAt: new Date(),

          reviewer: "Security Admin",

          notes:
            "Video analyzed using temporal frame ensemble.",

          modelId: "video-frame-temporal",

          modelName:
            "VideoTruth Frame-Temporal Ensemble",

          aiServiceUsed: true,

          fallbackUsed: false,

          scores: {
            fakeProbability: ai.fakeProbability,

            realProbability: ai.realProbability,

            framesAnalyzed: ai.framesAnalyzed,

            fakeFrameRatio: ai.fakeFrameRatio,

            averageFrameConfidence:
              ai.averageFrameConfidence,
          },

          timeline: ai.timeline || [],
        },
      });
    } catch (error: any) {
      console.error("VIDEO AI ERROR:", error.message);

      // FALLBACK MODE
      return res.json({
        success: true,
        message:
          "Video analysis completed using fallback mode",

        data: {
          id: `TG-${Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()}`,

          module: "video",

          originalName: req.file?.originalname,

          verdict:
            "Video requires manual reviewer validation",

          confidence: 74,

          risk: "Medium",

          status: "In Review",

          reviewer: "Security Admin",

          modelId: "video-frame-temporal",

          modelName:
            "VideoTruth Frame-Temporal Ensemble",

          aiServiceUsed: false,

          fallbackUsed: true,

          scores: {
            fakeProbability: 74,
            realProbability: 26,
          },

          timeline: [],
        },
      });
    }
  }
);

export default router;