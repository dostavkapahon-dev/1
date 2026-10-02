import { NextResponse } from "next/server";
import { api, requireOrigin, rateLimit } from "../../../../lib/http";
import { requireMember } from "../../../../lib/session";
import { createTelegramLink } from "../../../../lib/telegram";
import { transaction } from "../../../../lib/db";

export const POST=api(async request=>{
  requireOrigin(request);const user=await requireMember();
  await rateLimit("telegram-link",user.id,10,600);
  return NextResponse.json(await createTelegramLink(user.id));
});
export const DELETE=api(async request=>{
  requireOrigin(request);const user=await requireMember();
  await transaction(async client=>{
    await client.query(`DELETE FROM telegram_links WHERE user_id=$1`,[user.id]);
    await client.query(`DELETE FROM telegram_link_requests WHERE user_id=$1`,[user.id]);
  });
  return NextResponse.json({ok:true});
});
