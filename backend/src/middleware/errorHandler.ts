import { NextFunction, Request, Response } from "express"; import { fail } from "../utils/apiResponse";
export function notFound(req:Request,res:Response){return fail(res,404,`Route not found: ${req.method} ${req.originalUrl}`);}
export function errorHandler(error:any,_req:Request,res:Response,_next:NextFunction){ console.error("API error:",error); if(error?.code==="LIMIT_FILE_SIZE") return fail(res,413,"Uploaded file is too large"); return fail(res,error?.status||500,error?.message||"Internal server error"); }
