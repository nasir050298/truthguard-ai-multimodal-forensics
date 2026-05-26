import { Response } from "express";
export function ok(res:Response,data:any,message="Success"){return res.json({success:true,message,data});}
export function fail(res:Response,status:number,message:string,details?:any){return res.status(status).json({success:false,message,details});}
