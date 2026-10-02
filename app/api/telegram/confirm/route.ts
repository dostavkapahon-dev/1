import { NextResponse } from "next/server";
import { api, requireOrigin } from "../../../../lib/http";
import { requireMember } from "../../../../lib/session";
import { confirmTelegramLink } from "../../../../lib/telegram";

export const POST=api(async request=>{
  requireOrigin(request);const user=await requireMember();
  await confirmTelegramLink(user.id);
  return NextResponse.json({ok:true});
});
