import { randomUUID } from "node:crypto";
import { db, transaction } from "./db";
import { digest, randomToken } from "./security";
import { HttpError } from "./http";

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_WEBHOOK_SECRET);
}
export async function createTelegramLink(userId:string) {
  if(!telegramConfigured()) throw new HttpError(503,"Подключение Telegram ещё не настроено администратором.");
  const token=randomToken();
  await db().query(`INSERT INTO telegram_link_requests(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')
    ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,candidate_id=NULL,candidate_name=NULL`,[userId,digest(token)]);
  return {url:`https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`,expiresIn:600};
}
export async function acceptTelegramStart(updateId:number,token:string,telegramId:string,displayName:string) {
  return transaction(async client=>{
    const inserted=await client.query(`INSERT INTO telegram_updates(update_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING update_id`,[updateId]);
    if(!inserted.rowCount) return false;
    const conflict=await client.query(`SELECT user_id FROM telegram_links WHERE telegram_id=$1`,[telegramId]);
    if(conflict.rowCount) return false;
    const request=await client.query(`UPDATE telegram_link_requests SET candidate_id=$1,candidate_name=$2 WHERE token_hash=$3 AND expires_at>now() AND candidate_id IS NULL RETURNING user_id`,[telegramId,displayName,digest(token)]);
    return Boolean(request.rowCount);
  });
}
export async function confirmTelegramLink(userId:string) {
  return transaction(async client=>{
    const {rows}=await client.query(`SELECT * FROM telegram_link_requests WHERE user_id=$1 AND expires_at>now() FOR UPDATE`,[userId]);
    if(!rows[0]?.candidate_id) throw new HttpError(409,"Сначала откройте бота и нажмите «Запустить». Ссылка действует 10 минут.");
    try {
      await client.query(`INSERT INTO telegram_links(user_id,telegram_id) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET telegram_id=EXCLUDED.telegram_id,linked_at=now()`,[userId,rows[0].candidate_id]);
    } catch(e) { if((e as {code?:string}).code==="23505") throw new HttpError(409,"Этот Telegram уже связан с другим участником."); throw e; }
    await client.query(`DELETE FROM telegram_link_requests WHERE user_id=$1`,[userId]);
    await client.query(`INSERT INTO audit_events(id,actor_id,action) VALUES($1,$2,'telegram_linked')`,[randomUUID(),userId]);
  });
}
