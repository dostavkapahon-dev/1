import { NextResponse } from "next/server";
import { api, body, HttpError, requireOrigin, rateLimit } from "../../../../../lib/http";
import { requireMember } from "../../../../../lib/session";
import { reportSchema } from "../../../../../lib/validation";
import { saveReport } from "../../../../../lib/tasks";

export const POST=api(async request=>{
  requireOrigin(request);
  const user=await requireMember();
  await rateLimit("report",user.id,120,60);
  const key=request.headers.get("idempotency-key");
  if(!key || !/^[a-zA-Z0-9_-]{8,100}$/.test(key)) throw new HttpError(400,"Нужен ключ повторяемого запроса.");
  const id=request.nextUrl.pathname.split("/").at(-2)!;
  const input=await body(request,reportSchema);
  return NextResponse.json(await saveReport(user.id,id,input,key));
});
