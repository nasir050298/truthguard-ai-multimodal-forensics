export type Role = "analyst" | "reviewer" | "admin";
export type ModuleType = "image" | "video" | "voice";
export type Risk = "Low" | "Medium" | "High" | "Critical";
export type ReportStatus = "Completed" | "In Review" | "Flagged" | "Archived";
export interface User { id:string; name:string; email:string; role:Role; }
export interface AuthUser extends User { password:string; }
export interface AnalysisReport { id:string; module:ModuleType; fileName:string; originalName:string; filePath:string; mimeType:string; sizeBytes:number; verdict:string; confidence:number; risk:Risk; status:ReportStatus; createdAt:string; reviewer:string; notes:string; modelId:string; modelName:string; aiServiceUsed:boolean; fallbackUsed:boolean; scores:Record<string,any>; timeline?:Array<Record<string,any>>; segments?:Array<Record<string,any>>; }
export interface AuditEvent { id:string; action:string; actor:string; module:ModuleType|"system"; severity:"Info"|"Warning"|"High"; createdAt:string; metadata?:Record<string,any>; }
export interface ModelSlot { id:string; module:ModuleType|"all"; name:string; provider:string; status:"Active"|"Standby"|"Training"|"Offline"; accuracy:number; latency:string; endpoint?:string; }
