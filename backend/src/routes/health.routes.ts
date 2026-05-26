import { Router } from "express"; import { ok } from "../utils/apiResponse";
export const healthRouter=Router(); healthRouter.get("/",(_req,res)=>ok(res,{status:"ok",service:"truthguard-ai-backend",timestamp:new Date().toISOString(),mode:"Option C: real API + optional AI services + fallback"}));
