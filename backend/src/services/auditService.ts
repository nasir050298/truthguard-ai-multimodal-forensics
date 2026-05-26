import { nanoid } from "nanoid"; import { AuditEvent } from "../types"; import { readJson, writeJson } from "../utils/fileDb";
const FILE="audit.json";
export function getAuditEvents(){ return readJson<AuditEvent[]>(FILE, []); }
export function addAuditEvent(input:Omit<AuditEvent,"id"|"createdAt">){ const events=getAuditEvents(); const event:AuditEvent={id:`audit_${nanoid(10)}`, createdAt:new Date().toISOString(), ...input}; events.unshift(event); writeJson(FILE, events.slice(0,1000)); return event; }
