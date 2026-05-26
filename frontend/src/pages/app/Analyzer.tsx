import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AudioWaveform,
  CheckCircle2,
  FileUp,
  Image,
  Info,
  ShieldCheck,
  TriangleAlert,
  Video,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { AnalysisResult, ModuleType } from "../../types";
import { moduleName } from "../../utils/helpers";
import { Panel, RiskBadge } from "../../components/ui/Shared";
import { TimelineChart, WaveformChart } from "../../components/charts/Charts";
import { analyzeMediaApi } from "../../services/api";

export default function Analyzer({ module }: { module: ModuleType }) {
  const addResult = useAppStore((s) => s.addResult);
  const allResults = useAppStore((s) => s.results);

  const existing = useMemo(
    () => allResults.filter((result) => result.module === module),
    [allResults, module]
  );

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const config = useMemo(() => {
    if (module === "image") {
      return {
        icon: Image,
        color: "text-guard-cyan",
        accept: "image/*",
        model: "DeepFakeShield Vision Classifier",
        title: "Image Forensics",
        desc: "Analyze fake profile photos, AI-generated images, manipulation artifacts, and metadata flags.",
      };
    }

    if (module === "video") {
      return {
        icon: Video,
        color: "text-guard-violet",
        accept: "video/*",
        model: "VideoTruth Frame-Temporal Ensemble",
        title: "Video Forensics",
        desc: "Sample frames, detect temporal inconsistencies, and visualize segment-level risk.",
      };
    }

    return {
      icon: AudioWaveform,
      color: "text-guard-green",
      accept: "audio/*",
      model: "VoiceGuard Wav2Vec2 Detector",
      title: "Voice Forensics",
      desc: "Analyze synthetic speech, voiceprint mismatch, replay attacks, and spectral artifacts.",
    };
  }, [module]);

  const Icon = config.icon;

  async function runAnalysis() {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);

    try {
      const backendResult = await analyzeMediaApi(module, file, {
        notes: "Submitted from TruthGuard AI frontend.",
      });

      setResult(backendResult);
      addResult(backendResult);

      toast.success("Analysis completed by backend");
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const aiModeLabel = result
    ? result.aiServiceUsed
      ? "Real Model"
      : "Fallback"
    : "Real/Fallback";

  const aiModeNote = result
    ? result.aiServiceUsed
      ? "Live AI service"
      : "Demo fallback"
    : "Service or fallback";

  return (
    <>
      <div className="mb-8">
        <span className="guard-badge">{config.model}</span>

        <h1 className="mt-4 flex items-center gap-3 text-4xl font-black">
          <Icon className={config.color} />
          {config.title}
        </h1>

        <p className="mt-2 max-w-3xl text-slate-400">{config.desc}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Panel className="p-6">
          <div className="grid place-items-center rounded-[1.5rem] border border-dashed border-white/20 bg-white/5 p-10 text-center">
            <FileUp className={config.color} size={48} />

            <h2 className="mt-5 text-2xl font-black">
              Upload {module} evidence
            </h2>

            <p className="mt-2 text-slate-400">
              This sends the file to your Express backend. If the Python AI
              service is offline, the backend returns a fallback result.
            </p>

            <input
              type="file"
              accept={config.accept}
              className="guard-input mt-6"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />

            {file && (
              <p className="mt-3 text-sm text-guard-cyan">
                Selected: {file.name}
              </p>
            )}

            <button
              onClick={runAnalysis}
              className="guard-button mt-5 w-full"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Run Backend Analysis"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
  <MiniStatusCard
    label="Backend"
    value="Express"
    note="API gateway"
    tone="cyan"
  />

  <MiniStatusCard
    label="AI Mode"
    value={aiModeLabel}
    note={aiModeNote}
    tone={
      result?.aiServiceUsed
        ? "green"
        : result?.fallbackUsed
        ? "amber"
        : "violet"
    }
  />

  <MiniStatusCard
    label="Report"
    value={result ? "Saved" : "Ready"}
    note={result ? "Backend JSON store" : "Waiting for upload"}
    tone="violet"
  />
</div>
        </Panel>

        <Panel className="p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-black">Result panel</h2>

            {result && (
              <StatusPill
                aiServiceUsed={Boolean(result.aiServiceUsed)}
                fallbackUsed={Boolean(result.fallbackUsed)}
              />
            )}
          </div>

          {!result ? (
            <div className="mt-6 rounded-[1.5rem] bg-white/5 p-8 text-center text-slate-400">
              <Info className="mx-auto mb-3 text-guard-cyan" />
              Upload a file and run analysis to get a backend response.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-[1.5rem] bg-white/5 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm text-slate-400">{result.id}</p>
                    <h3 className="text-2xl font-black">{result.verdict}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {result.fileName}
                    </p>
                  </div>

                  <RiskBadge risk={result.risk} />
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-guard-cyan"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>

                <p className="mt-2 text-sm font-bold text-guard-cyan">
                  Top Prediction Confidence: {result.confidence}%
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["AI Service Used", result.aiServiceUsed ? "Yes" : "No"],
                  ["Fallback Used", result.fallbackUsed ? "Yes" : "No"],
                  ["Model", result.modelName || "Unknown model"],
                  ["Report Status", result.status],
                  ["Reviewer", result.reviewer],
                  ["Module", result.module.toUpperCase()],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p
                      className={`mt-1 text-xl font-black ${
                        label === "AI Service Used" && value === "Yes"
                          ? "text-guard-green"
                          : label === "Fallback Used" && value === "Yes"
                          ? "text-guard-amber"
                          : label === "Fallback Used" && value === "No"
                          ? "text-guard-green"
                          : "text-white"
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {result.scores && (
                <div className="rounded-[1.5rem] bg-white/5 p-5">
                  <h4 className="text-xl font-black">
                    Model probability details
                  </h4>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailCard
                      label="Real Probability"
                      value={`${result.scores.realProbability ?? "N/A"}%`}
                      className="text-guard-green"
                    />

                    <DetailCard
                      label="Fake Probability"
                      value={`${result.scores.fakeProbability ?? "N/A"}%`}
                      className="text-guard-rose"
                    />

                    <DetailCard
                      label="Top Model Label"
                      value={result.scores.modelTopLabel || "N/A"}
                    />

                    <DetailCard
                      label="Inference Time"
                      value={
                        result.scores.inferenceTimeMs
                          ? `${result.scores.inferenceTimeMs} ms`
                          : "N/A"
                      }
                    />

                    <DetailCard
                      label="Image Size"
                      value={
                        result.scores.imageWidth && result.scores.imageHeight
                          ? `${result.scores.imageWidth} × ${result.scores.imageHeight}`
                          : "N/A"
                      }
                    />

                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="text-sm text-slate-400">Model ID</p>
                      <p className="mt-1 break-words text-sm font-black text-guard-cyan">
                        {result.scores.modelId || result.modelId || "N/A"}
                      </p>
                    </div>
                  </div>

                  {result.scores.modelPredictions && (
                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                        Raw model predictions
                      </p>

                      <div className="space-y-3">
                        {result.scores.modelPredictions.map((prediction) => (
                          <div
                            key={prediction.label}
                            className="rounded-2xl bg-black/20 p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-black">
                                {prediction.label}
                              </span>
                              <span className="font-black text-guard-cyan">
                                {prediction.percentage}%
                              </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-guard-cyan"
                                style={{
                                  width: `${prediction.percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {module === "video" && <TimelineChart />}
        {module === "voice" && <WaveformChart />}
        {module === "image" && <ImageExplainability />}

        <Panel className="p-6">
          <h2 className="text-2xl font-black">
            Recent {moduleName(module)} cases
          </h2>

          <div className="mt-5 space-y-3">
            {existing.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-black">{item.fileName}</p>
                  <p className="text-sm text-slate-400">{item.verdict}</p>
                </div>

                <RiskBadge risk={item.risk} />
              </div>
            ))}

            {!existing.length && (
              <p className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">
                No recent {moduleName(module)} cases yet.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

function StatusPill({
  aiServiceUsed,
  fallbackUsed,
}: {
  aiServiceUsed: boolean;
  fallbackUsed: boolean;
}) {
  if (aiServiceUsed && !fallbackUsed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-guard-green/20 bg-guard-green/10 px-4 py-2 text-sm font-black text-guard-green">
        <CheckCircle2 size={16} />
        Real model active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-guard-amber/20 bg-guard-amber/10 px-4 py-2 text-sm font-black text-guard-amber">
      <TriangleAlert size={16} />
      Fallback mode
    </span>
  );
}

function DetailCard({
  label,
  value,
  className = "text-white",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-black ${className}`}>{value}</p>
    </div>
  );
}

function ImageExplainability() {
  return (
    <Panel className="p-6">
      <h3 className="text-2xl font-black">Attention-style artifact overlay</h3>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-[1.5rem] bg-slate-950 p-4">
        {Array.from({ length: 32 }).map((_, index) => (
          <div
            key={index}
            className={`h-12 rounded-xl ${
              index % 5 === 0
                ? "bg-guard-rose/70"
                : index % 3 === 0
                ? "bg-guard-amber/50"
                : "bg-guard-cyan/20"
            }`}
          />
        ))}
      </div>

      <p className="mt-4 text-sm text-slate-400">
        Demo heatmap concept for suspicious face regions, texture seams, and
        artifact clusters.
      </p>
    </Panel>
  );
}

function MiniStatusCard({
  label,
  value,
  note,
  tone = "cyan",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "cyan" | "green" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    cyan: "text-guard-cyan",
    green: "text-guard-green",
    violet: "text-guard-violet",
    amber: "text-guard-amber",
    rose: "text-guard-rose",
  }[tone];

  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-3 break-words text-2xl font-black leading-tight ${toneClass}`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-slate-400">{note}</p>
    </div>
  );
}