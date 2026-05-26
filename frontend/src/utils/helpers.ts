import { ModuleType, Risk } from "../types";
export function riskColor(risk:Risk){if(risk==="Critical")return"bg-guard-rose/15 text-guard-rose border-guard-rose/20";if(risk==="High")return"bg-orange-500/15 text-orange-300 border-orange-500/20";if(risk==="Medium")return"bg-guard-amber/15 text-guard-amber border-guard-amber/20";return"bg-guard-green/15 text-guard-green border-guard-green/20"}
export function moduleName(module:ModuleType){return module==="image"?"Image Forensics":module==="video"?"Video Forensics":"Voice Forensics"}
export function randomConfidence(module:ModuleType){const base=module==="image"?86:module==="video"?79:83;return Math.min(98,base+Math.floor(Math.random()*12))}
export function riskFromConfidence(confidence:number):Risk{if(confidence>=92)return"Critical";if(confidence>=84)return"High";if(confidence>=70)return"Medium";return"Low"}
