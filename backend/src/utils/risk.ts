import { Risk } from "../types";
export function clampScore(v:number){ return Math.max(1, Math.min(99, Math.round(v))); }
export function riskFromConfidence(c:number):Risk { if(c>=92) return "Critical"; if(c>=84) return "High"; if(c>=70) return "Medium"; return "Low"; }
export function randomBetween(min:number,max:number){ return Math.round(min + Math.random()*(max-min)); }
