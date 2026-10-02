import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { api, body, requireOrigin } from "../../../lib/http";
import { requireMember } from "../../../lib/session";
import { profileSchema } from "../../../lib/validation";
import { transaction } from "../../../lib/db";

export const GET=api(async()=>NextResponse.json({user:await requireMember()}));
export const PATCH=api(async request=>{
  requireOrigin(request);
  const user=await requireMember();
  const input=await body(request,profileSchema);
  await transaction(async client=>{
    const existing=await client.query(`SELECT onboarded FROM "User" WHERE id=$1 FOR UPDATE`,[user.id]);
    await client.query(`UPDATE "User" SET name=$2,timezone=$3,focus=$4,goal=$5,answers=$6,scores=$7,paused=$8,onboarded=true,"updatedAt"=now(),last_seen_at=now() WHERE id=$1`,[user.id,input.name,input.timezone,input.focus,input.goal,JSON.stringify(input.answers),JSON.stringify(input.scores),input.paused]);
    if(!existing.rows[0].onboarded) await client.query(`INSERT INTO monthly_snapshots(id,user_id,scores) VALUES($1,$2,$3)`,[randomUUID(),user.id,JSON.stringify(input.scores)]);
  });
  return NextResponse.json({ok:true});
});
