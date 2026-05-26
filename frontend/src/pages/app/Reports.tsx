import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Archive, FileText, RefreshCcw, Search } from "lucide-react";
import { Panel, RiskBadge, SectionTitle } from "../../components/ui/Shared";
import { useAppStore } from "../../store/appStore";
import {
  deleteReportApi,
  getReportsApi,
  reviewReportApi,
} from "../../services/api";

export default function Reports() {
  const results = useAppStore((s) => s.results);
  const setResults = useAppStore((s) => s.setResults);
  const updateStatus = useAppStore((s) => s.updateStatus);
  const removeResult = useAppStore((s) => s.removeResult);

  const [loading, setLoading] = useState(false);

  async function loadReports() {
    setLoading(true);

    try {
      const backendReports = await getReportsApi();
      setResults(backendReports);
      toast.success("Reports loaded from backend");
    } catch (error: any) {
      toast.error(error.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function archiveReport(id: string) {
    try {
      await reviewReportApi(id, {
        status: "Archived",
        notes: "Archived from frontend reports page.",
      });

      updateStatus(id, "Archived");
      toast.success("Report archived");
    } catch (error: any) {
      toast.error(error.message || "Failed to archive report");
    }
  }

  async function deleteReport(id: string) {
    try {
      await deleteReportApi(id);
      removeResult(id);
      toast.success("Report deleted");
    } catch (error: any) {
      toast.error(error.message || "Only admin can delete reports");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <>
      <SectionTitle
        eyebrow="Reports"
        title="Unified forensic reports"
        text="All image, video, and voice reports are loaded from the backend."
      />

      <div className="mb-5 flex justify-end">
        <button onClick={loadReports} className="guard-button-alt">
          <RefreshCcw size={17} />
          {loading ? "Loading..." : "Refresh reports"}
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead>
              <tr>
                <th className="table-th">Case</th>
                <th className="table-th">Module</th>
                <th className="table-th">File</th>
                <th className="table-th">Verdict</th>
                <th className="table-th">Risk</th>
                <th className="table-th">Status</th>
                <th className="table-th">Reviewer</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>

            <tbody>
              {results.map((result) => (
                <tr
                  key={result.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="table-td font-black">{result.id}</td>
                  <td className="table-td capitalize">{result.module}</td>
                  <td className="table-td">{result.fileName}</td>
                  <td className="table-td">
                    <span className="block max-w-[260px] truncate">
                      {result.verdict}
                    </span>
                  </td>
                  <td className="table-td">
                    <RiskBadge risk={result.risk} />
                  </td>
                  <td className="table-td">{result.status}</td>
                  <td className="table-td">{result.reviewer}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button className="rounded-full bg-guard-cyan/10 p-2 text-guard-cyan">
                        <FileText size={16} />
                      </button>

                      <button className="rounded-full bg-white/10 p-2">
                        <Search size={16} />
                      </button>

                      <button
                        onClick={() => archiveReport(result.id)}
                        className="rounded-full bg-guard-rose/10 p-2 text-guard-rose"
                      >
                        <Archive size={16} />
                      </button>

                      <button
                        onClick={() => deleteReport(result.id)}
                        className="rounded-full bg-red-600/20 px-3 py-2 text-xs font-black text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!results.length && (
                <tr>
                  <td className="table-td text-slate-400" colSpan={8}>
                    No backend reports found.
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