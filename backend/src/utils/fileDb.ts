import fs from "fs"; import path from "path"; import { env } from "../config/env";
export function ensureStorage(){ fs.mkdirSync(env.DATA_DIR,{recursive:true}); fs.mkdirSync(env.UPLOAD_DIR,{recursive:true}); for(const f of ["image","video","voice","misc"]){fs.mkdirSync(path.join(env.UPLOAD_DIR,f),{recursive:true});}}
export function readJson<T>(fileName:string, fallback:T):T { ensureStorage(); const fp=path.join(env.DATA_DIR,fileName); if(!fs.existsSync(fp)){ writeJson(fileName,fallback); return fallback;} try{return JSON.parse(fs.readFileSync(fp,"utf-8")) as T;}catch{return fallback;} }
export function writeJson<T>(fileName:string, data:T){ ensureStorage(); fs.writeFileSync(path.join(env.DATA_DIR,fileName), JSON.stringify(data,null,2), "utf-8"); }
