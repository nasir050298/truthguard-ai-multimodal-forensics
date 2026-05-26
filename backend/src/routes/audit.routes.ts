import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { addAuditEvent, getAuditEvents } from "../services/auditService";
import { fail, ok } from "../utils/apiResponse";

export const auditRouter = Router();

auditRouter.get("/", requireAuth, (req, res) => {
  const { module, severity } = req.query;

  let events = getAuditEvents();

  if (module) {
    events = events.filter((event) => event.module === module);
  }

  if (severity) {
    events = events.filter((event) => event.severity === severity);
  }

  return ok(res, events);
});

const schema = z.object({
  action: z.string().min(1),
  module: z.enum(["image", "video", "voice", "system"]),
  severity: z.enum(["Info", "Warning", "High"]).default("Info"),
  metadata: z.record(z.any()).optional(),
});

auditRouter.post("/", requireAuth, (req, res) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return fail(
      res,
      400,
      "Invalid audit payload",
      parsed.error.flatten()
    );
  }

  const { action, module, severity, metadata } = parsed.data;

  const event = addAuditEvent({
    action,
    module,
    severity,
    metadata,
    actor: req.user?.name || "Unknown user",
  });

  return ok(res, event, "Audit event saved");
});