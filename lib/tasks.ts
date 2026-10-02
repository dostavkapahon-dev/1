import { randomUUID } from "node:crypto";
import { db, transaction } from "./db";
import { taskCatalog, type Sphere } from "./domain";
import { HttpError } from "./http";
import type { Member } from "./session";
import { digest } from "./security";

export type Task = { id:string; title:string; sphere:Sphere; variants:Record<"minimum"|"normal"|"expanded",string>; localDate:string; status:string; variant:string|null; note?:string; };
export function localDay(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const value=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export async function todayTask(user: Member): Promise<Task|null> {
  if (!user.onboarded) return null;
  return transaction(async client => {
    const locked = await client.query(`SELECT focus,timezone,paused FROM "User" WHERE id=$1 FOR UPDATE`, [user.id]);
    const current = locked.rows[0];
    if (!current) return null;
    const day = localDay(current.timezone);
    let result = await client.query(`SELECT * FROM "TaskInstance" WHERE "userId"=$1 AND "localDate"=$2 AND status<>'REPLACED'`,[user.id,day]);
    if (!result.rowCount && !current.paused) {
      const template=taskCatalog[current.focus as Sphere];
      result=await client.query(`INSERT INTO "TaskInstance"(id,"userId","templateId","localDate",title,sphere,variants,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [randomUUID(),user.id,current.focus,day,template.title,template.sphere,JSON.stringify(template.variants),current.timezone]);
    }
    if (!result.rowCount) return null;
    const report=await client.query(`SELECT note FROM "TaskReport" WHERE "taskId"=$1 AND "userId"=$2`,[result.rows[0].id,user.id]);
    return {...result.rows[0],note:report.rows[0]?.note??""};
  });
}
type ReportInput = { result: "COMPLETED" | "PARTIAL" | "SKIPPED"; variant: "minimum" | "normal" | "expanded"; note?: string };
export async function saveReport(userId:string, taskId:string, input:ReportInput, key:string) {
  const report = { ...input, note: input.note ?? "" };
  const fingerprint=digest(JSON.stringify({taskId,...report}));
  return transaction(async client=>{
    // Serializing on the owner also protects against concurrent requests with the same idempotency key.
    await client.query(`SELECT id FROM "User" WHERE id=$1 FOR UPDATE`,[userId]);
    const previous=await client.query(`SELECT fingerprint,response FROM request_keys WHERE user_id=$1 AND key=$2`,[userId,key]);
    if(previous.rowCount) {
      if(previous.rows[0].fingerprint!==fingerprint) throw new HttpError(409,"Этот запрос уже был отправлен с другими данными.");
      return previous.rows[0].response;
    }
    const task=await client.query(`SELECT id FROM "TaskInstance" WHERE id=$1 AND "userId"=$2 AND status<>'REPLACED' FOR UPDATE`,[taskId,userId]);
    if(!task.rowCount) throw new HttpError(404,"Задача не найдена.");
    await client.query(`INSERT INTO "TaskReport"(id,"userId","taskId",result,note) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT("taskId") DO UPDATE SET result=EXCLUDED.result,note=EXCLUDED.note`,[randomUUID(),userId,taskId,report.result,report.note]);
    await client.query(`INSERT INTO report_revisions(id,task_id,user_id,result,note) VALUES($1,$2,$3,$4,$5)`,[randomUUID(),taskId,userId,report.result,report.note]);
    await client.query(`UPDATE "TaskInstance" SET status=$1,variant=$2,updated_at=now() WHERE id=$3`,[report.result,report.variant,taskId]);
    await client.query(`UPDATE "User" SET last_seen_at=now() WHERE id=$1`,[userId]);
    const response={ok:true,taskId,status:input.result};
    await client.query(`INSERT INTO request_keys(user_id,key,fingerprint,response) VALUES($1,$2,$3,$4)`,[userId,key,fingerprint,JSON.stringify(response)]);
    return response;
  });
}
export async function recentTasks(userId:string) {
  return (await db().query(`SELECT t.id,t.title,t.sphere,t."localDate",t.status,t.variant,r.note FROM "TaskInstance" t LEFT JOIN "TaskReport" r ON r."taskId"=t.id WHERE t."userId"=$1 ORDER BY t."localDate" DESC,t."createdAt" DESC LIMIT 60`,[userId])).rows;
}
