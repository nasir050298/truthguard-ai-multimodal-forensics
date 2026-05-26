import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Save,
  ShieldAlert,
} from "lucide-react";
import { Panel, RiskBadge, SectionTitle, StatCard } from "../../components/ui/Shared";
import { threatIntel } from "../../data/mockData";
import { useAppStore } from "../../store/appStore";
import {
  getAuditApi,
  getModelHealthApi,
  reviewReportApi,
} from "../../services/api";

export function Cases() {
  const results = useAppStore((s) => s.results);
  const updateStatus = useAppStore((s) => s.updateStatus);

  const queue = useMemo(
    () =>
      results.filter(
        (result) =>
          result.status === "In Review" || result.status === "Flagged"
      ),
    [results]
  );

  async function updateCase(id: string, status: "Completed" | "Archived") {
    try {
      await reviewReportApi(id, {
        status,
        notes: `Case marked as ${status} from frontend reviewer workflow.`,
      });

      updateStatus(id, status);
      toast.success(`Case ${status.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update case");
    }
  }

  return (
    <>
      <SectionTitle
        eyebrow="Reviewer workflow"
        title="Case review queue"
        text="Prioritize high-risk image, video, and voice cases for manual reviewer validation."
      />

      <div className="grid gap-5">
        {queue.map((item) => (
          <Panel key={item.id} className="p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <p className="text-sm text-slate-400">
                  {item.id} • {item.module.toUpperCase()}
                </p>
                <h3 className="text-2xl font-black">{item.fileName}</h3>
                <p className="mt-1 text-slate-400">{item.verdict}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge risk={item.risk} />

                <button
                  onClick={() => updateCase(item.id, "Completed")}
                  className="guard-button-alt"
                >
                  <CheckCircle2 size={17} />
                  Approve
                </button>

                <button
                  onClick={() => updateCase(item.id, "Archived")}
                  className="guard-button-alt"
                >
                  Archive
                </button>
              </div>
            </div>
          </Panel>
        ))}

        {!queue.length && (
          <Panel className="p-8 text-center text-slate-400">
            No cases currently waiting for review.
          </Panel>
        )}
      </div>
    </>
  );
}

export function ModelLab() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadModels() {
    setLoading(true);

    try {
      const data = await getModelHealthApi();
      setModels(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load model health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <>
      <SectionTitle
        eyebrow="Model Lab"
        title="AI model health and custom model slots"
        text="Model data is loaded from the backend model registry and health route."
      />

      <div className="mb-5 flex justify-end">
        <button onClick={loadModels} className="guard-button-alt">
          {loading ? "Checking..." : "Check model health"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {models.map((model) => (
          <Panel key={model.id} className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <h3 className="text-2xl font-black">{model.name}</h3>
                <p className="mt-1 text-slate-400">{model.provider}</p>
              </div>

              <span
                className={`h-fit rounded-full px-3 py-1 text-sm font-black ${
                  model.serviceReachable
                    ? "bg-guard-green/10 text-guard-green"
                    : "bg-guard-amber/10 text-guard-amber"
                }`}
              >
                {model.serviceReachable ? "Reachable" : "Fallback mode"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard label="Module" value={model.module.toString().toUpperCase()} />
              <StatCard label="Accuracy" value={`${model.accuracy}%`} tone="green" />
              <StatCard label="Latency" value={model.latency} tone="violet" />
            </div>

            {model.note && (
              <p className="mt-4 rounded-2xl bg-guard-amber/10 p-3 text-sm text-guard-amber">
                {model.note}
              </p>
            )}
          </Panel>
        ))}
      </div>

      <Panel className="mt-8 p-6">
        <h3 className="text-2xl font-black">Custom model upload slot</h3>

        <p className="mt-2 text-slate-400">
          Placeholder for ONNX, PyTorch, Hugging Face, or REST model registration.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <input className="guard-input md:col-span-2" placeholder="Model name" />

          <select className="guard-input">
            <option>Image</option>
            <option>Video</option>
            <option>Voice</option>
            <option>Fusion</option>
          </select>

          <input className="guard-input md:col-span-3" type="file" />
        </div>

        <button
          onClick={() => toast.success("Model slot saved locally")}
          className="guard-button mt-5"
        >
          <FileUp size={17} />
          Register Model
        </button>
      </Panel>
    </>
  );
}

export function ThreatIntel() {
  return (
    <>
      <SectionTitle
        eyebrow="Threat Intel"
        title="Emerging deepfake and synthetic media threats"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {threatIntel.map((item) => (
          <Panel key={item.title} className="p-5">
            <ShieldAlert className="text-guard-rose" />

            <h3 className="mt-4 text-xl font-black">{item.title}</h3>

            <p className="mt-2 text-slate-400">{item.module}</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-black text-guard-rose">{item.risk}</span>
              <span className="font-black text-guard-green">
                {item.change}
              </span>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function AuditLogs() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAudit() {
    setLoading(true);

    try {
      const data = await getAuditApi();
      setEvents(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <>
      <SectionTitle
        eyebrow="Audit"
        title="Tamper-aware activity trail"
        text="Audit logs are now loaded from the backend."
      />

      <div className="mb-5 flex justify-end">
        <button onClick={loadAudit} className="guard-button-alt">
          {loading ? "Loading..." : "Refresh audit logs"}
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Panel key={event.id} className="p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xl font-black">{event.action}</p>

                <p className="mt-1 text-slate-400">
                  {event.actor} • {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>

              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">
                {event.severity}
              </span>
            </div>
          </Panel>
        ))}

        {!events.length && (
          <Panel className="p-8 text-center text-slate-400">
            No audit events found yet.
          </Panel>
        )}
      </div>
    </>
  );
}

export function Limitations() {
  return (
    <>
      <SectionTitle
        eyebrow="Responsible AI"
        title="Limitations and human review guidance"
        text="AI forensic tools support analysts but should not be treated as final legal truth without verification."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {[
          [
            "Model confidence is not proof",
            "High confidence should be interpreted with context, source verification, and reviewer judgment.",
          ],
          [
            "Compression may affect results",
            "Low-quality files, re-encoding, screen recording, or noise can impact detection reliability.",
          ],
          [
            "Bias and domain shift",
            "Models may perform differently across cultures, languages, devices, and media sources.",
          ],
          [
            "Human-in-the-loop required",
            "Important cases should be reviewed by trained analysts and documented through the audit trail.",
          ],
        ].map(([title, text]) => (
          <Panel key={title} className="p-6">
            <AlertTriangle className="text-guard-amber" />

            <h3 className="mt-4 text-2xl font-black">{title}</h3>

            <p className="mt-3 text-slate-400">{text}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function Settings() {
  return (
    <>
      <SectionTitle eyebrow="Settings" title="Platform configuration" />

      <Panel className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="guard-input"
            defaultValue="TruthGuard AI Fusion Console"
          />

          <input
            className="guard-input"
            defaultValue="security@truthguard.ai"
          />

          <select className="guard-input">
            <option>Risk threshold: Standard</option>
            <option>Risk threshold: Strict</option>
          </select>

          <select className="guard-input">
            <option>Reviewer approval required</option>
            <option>Auto close low-risk cases</option>
          </select>

          <select className="guard-input">
            <option>Report format: PDF-ready</option>
            <option>Report format: JSON</option>
          </select>

          <select className="guard-input">
            <option>Retention: 90 days</option>
            <option>Retention: 1 year</option>
          </select>
        </div>

        <button
          onClick={() => toast.success("Settings saved")}
          className="guard-button mt-5"
        >
          <Save size={17} />
          Save Settings
        </button>
      </Panel>
    </>
  );
}