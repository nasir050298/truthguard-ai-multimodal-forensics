import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { RiskPie, TrendChart } from "../../components/charts/Charts";
import { Panel, RiskBadge, StatCard } from "../../components/ui/Shared";
import { useAppStore } from "../../store/appStore";
import { getReportsApi } from "../../services/api";

export default function Dashboard() {
  const results = useAppStore((s) => s.results);
  const setResults = useAppStore((s) => s.setResults);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);

      try {
        const backendReports = await getReportsApi();
        setResults(backendReports);
      } catch (error: any) {
        toast.error(error.message || "Failed to load reports from backend");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [setResults]);

  const critical = useMemo(
    () => results.filter((result) => result.risk === "Critical").length,
    [results]
  );

  return (
    <>
      <div className="mb-8">
        <span className="guard-badge">Command Center</span>

        <h1 className="mt-4 text-4xl font-black">
          Multimodal AI forensics overview
        </h1>

        <p className="mt-2 text-slate-400">
          Unified case intelligence from image, video, and voice detection
          modules.
        </p>

        {loading && (
          <p className="mt-3 text-sm font-bold text-guard-cyan">
            Loading reports from backend...
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total cases"
          value={String(results.length)}
          note="Backend reports"
        />

        <StatCard
          label="Image cases"
          value={String(results.filter((r) => r.module === "image").length)}
          tone="cyan"
        />

        <StatCard
          label="Video cases"
          value={String(results.filter((r) => r.module === "video").length)}
          tone="violet"
        />

        <StatCard
          label="Voice cases"
          value={String(results.filter((r) => r.module === "voice").length)}
          tone="green"
        />

        <StatCard label="Critical" value={String(critical)} tone="rose" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <TrendChart />
        <RiskPie />
      </div>

      <Panel className="mt-8 overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-2xl font-black">Recent forensic results</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full">
            <thead>
              <tr>
                <th className="table-th">Case</th>
                <th className="table-th">Module</th>
                <th className="table-th">File</th>
                <th className="table-th">Verdict</th>
                <th className="table-th">Risk</th>
                <th className="table-th">Confidence</th>
              </tr>
            </thead>

            <tbody>
              {results.slice(0, 6).map((result) => (
                <tr
                  key={result.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="table-td font-black">{result.id}</td>
                  <td className="table-td capitalize">{result.module}</td>
                  <td className="table-td">{result.fileName}</td>
                  <td className="table-td">{result.verdict}</td>
                  <td className="table-td">
                    <RiskBadge risk={result.risk} />
                  </td>
                  <td className="table-td font-black text-guard-cyan">
                    {result.confidence}%
                  </td>
                </tr>
              ))}

              {!results.length && (
                <tr>
                  <td className="table-td text-slate-400" colSpan={6}>
                    No reports found. Run an analysis first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}