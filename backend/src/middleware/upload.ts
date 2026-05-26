import multer from "multer"; import path from "path"; import { nanoid } from "nanoid"; import { env } from "../config/env"; import { ensureStorage } from "../utils/fileDb";
ensureStorage();
function folderFromRoute(url:string){ if(url.includes("/image")) return "image"; if(url.includes("/video")) return "video"; if(url.includes("/voice")) return "voice"; return "misc"; }
const storage=multer.diskStorage({ destination:(req,_file,cb)=>cb(null,path.join(env.UPLOAD_DIR,folderFromRoute(req.originalUrl))), filename:(_req,file,cb)=>cb(null,`${Date.now()}-${nanoid(8)}${path.extname(file.originalname||"")}`) });
export const uploadSingle=multer({storage, limits:{fileSize:env.MAX_UPLOAD_MB*1024*1024}}).single("file");
