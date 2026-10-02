import { z } from "zod";
import { NextResponse } from "next/server";
import { api,body,HttpError,rateLimit,requireOrigin } from "../../../../lib/http";
import { cookieName,requireMember } from "../../../../lib/session";
import { db } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/security";

export const POST=api(async request=>{
  requireOrigin(request);const user=await requireMember();
  await rateLimit("delete",user.id,5,3600);
  const input=await body(request,z.object({password:z.string().max(128),confirmation:z.literal("УДАЛИТЬ")}).strict());
  const result=await db().query(`SELECT password_hash FROM "User" WHERE id=$1`,[user.id]);
  if(!await verifyPassword(input.password,result.rows[0].password_hash)) throw new HttpError(401,"Неверный пароль.");
  await db().query(`DELETE FROM "User" WHERE id=$1`,[user.id]);
  const response=NextResponse.json({ok:true});response.cookies.set(cookieName,"",{path:"/",maxAge:0});return response;
});
