import { AnalysisReport } from "../types"; import { readJson, writeJson } from "../utils/fileDb";
const FILE="reports.json";
export function getReports(){ return readJson<AnalysisReport[]>(FILE, []); }
export function saveReport(report:AnalysisReport){ const reports=getReports(); reports.unshift(report); writeJson(FILE,reports); return report; }
export function getReport(id:string){ return getReports().find(r=>r.id===id); }
export function updateReport(id:string, updates:Partial<Pick<AnalysisReport,"status"|"reviewer"|"notes">>){ const reports=getReports(); const next=reports.map(r=>r.id===id?{...r,...updates}:r); writeJson(FILE,next); return next.find(r=>r.id===id); }
export function deleteReport(id:string){ const reports=getReports(); const next=reports.filter(r=>r.id!==id); writeJson(FILE,next); return {deleted:reports.length!==next.length}; }
