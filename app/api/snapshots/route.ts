import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { api, requireOrigin, rateLimit } from "../../../lib/http";
import { requireMember } from "../../../lib/session";
import { db } from "../../../lib/db";

export const POST=api(async request=>{
  requireOrigin(request);
  const user=await requireMember();
  await rateLimit("snapshot",user.id,5,86400);
  await db().query(`INSERT INTO monthly_snapshots(id,user_id,scores) VALUES($1,$2,$3)`,[randomUUID(),user.id,JSON.stringify(user.scores)]);
  return NextResponse.json({ok:true},{status:201});
});
