import { NextResponse } from "next/server";
import { z } from "zod";
import { api, body, HttpError } from "../../../../lib/http";
import { secretsEqual } from "../../../../lib/security";
import { acceptTelegramStart } from "../../../../lib/telegram";

const updateSchema=z.object({update_id:z.number().int().nonnegative(),message:z.object({text:z.string().max(4096).optional(),from:z.object({id:z.number().int().positive(),first_name:z.string().max(256).optional(),is_bot:z.boolean().optional()}).optional(),chat:z.object({id:z.number().int(),type:z.string()})}).optional()});
export const POST=api(async request=>{
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!secret) throw new HttpError(503,"Telegram не настроен.");
  if(!secretsEqual(request.headers.get("x-telegram-bot-api-secret-token")??"",secret)) throw new HttpError(403,"Недопустимый запрос.");
  const update=await body(request,updateSchema);
  const message=update.message;
  if(message?.chat.type==="private" && message.from && !message.from.is_bot && message.chat.id===message.from.id) {
    const match=message.text?.match(/^\/start(?:@[A-Za-z0-9_]+)? ([A-Za-z0-9_-]{43})$/);
    if(match) await acceptTelegramStart(update.update_id,match[1],String(message.from.id),message.from.first_name??"Участник Telegram");
  }
  // Linking confirmation is displayed in the authenticated website. No private
  // task, diary or email is sent into a chat before the user confirms the link.
  return NextResponse.json({ok:true});
});
