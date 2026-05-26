import { NextFunction, Request, Response } from "express"; import jwt from "jsonwebtoken"; import { env } from "../config/env"; import { User } from "../types"; import { fail } from "../utils/apiResponse";
declare global { namespace Express { interface Request { user?: User } } }
export function signToken(user:User){ return jwt.sign(user, env.JWT_SECRET, { expiresIn:"7d" }); }
export function requireAuth(req:Request,res:Response,next:NextFunction){ const h=req.headers.authorization; if(!h?.startsWith("Bearer ")) return fail(res,401,"Missing authorization token"); try{ req.user=jwt.verify(h.replace("Bearer ",""), env.JWT_SECRET) as User; next(); }catch{return fail(res,401,"Invalid or expired token");}}
export function requireRole(roles:Array<User["role"]>){ return (req:Request,res:Response,next:NextFunction)=>{ if(!req.user) return fail(res,401,"Unauthorized"); if(!roles.includes(req.user.role)) return fail(res,403,"You do not have permission for this action"); next(); }; }
