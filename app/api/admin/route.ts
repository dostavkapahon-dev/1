import { NextResponse } from "next/server";
import { api, HttpError } from "../../../lib/http";
import { requireMember } from "../../../lib/session";
import { db } from "../../../lib/db";

export const GET=api(async request=>{
  await requireMember(true);
  const search=(request.nextUrl.searchParams.get("search")??"").trim().slice(0,100);
  const page=Number(request.nextUrl.searchParams.get("page")??1);
  const status=request.nextUrl.searchParams.get("status")??"all";
  if(!Number.isInteger(page)||page<1||page>10000||!["all","OFFERED","COMPLETED","PARTIAL","SKIPPED"].includes(status)) throw new HttpError(400,"Некорректный фильтр.");
  const pattern=`%${search.replace(/[\\%_]/g,"\\$&")}%`;
  const results=await Promise.all([
    db().query(`SELECT
      (SELECT count(*)::int FROM "User" WHERE role='participant') AS participants,
      (SELECT count(*)::int FROM telegram_links l JOIN "User" u ON u.id=l.user_id WHERE u.role='participant') AS connected,
      (SELECT count(*)::int FROM "User" WHERE role='participant' AND last_seen_at>now()-interval '7 days') AS active,
      (SELECT count(*)::int FROM "TaskInstance" t JOIN "User" u ON u.id=t."userId" WHERE u.role='participant' AND t.status<>'REPLACED') AS assigned,
      (SELECT count(*)::int FROM "TaskInstance" t JOIN "User" u ON u.id=t."userId" WHERE u.role='participant' AND t.status='COMPLETED') AS completed,
      (SELECT count(*)::int FROM "TaskInstance" t JOIN "User" u ON u.id=t."userId" WHERE u.role='participant' AND t.status='PARTIAL') AS partial`),
    db().query(`SELECT u.id,u.name,u.email,u."createdAt",u.last_seen_at,u.paused,u.onboarded,
      (l.user_id IS NOT NULL) AS telegram_connected,
      count(t.id)::int AS assigned,count(t.id) FILTER(WHERE t.status='COMPLETED')::int AS completed,
      count(t.id) FILTER(WHERE t.status='PARTIAL')::int AS partial
      FROM "User" u LEFT JOIN telegram_links l ON l.user_id=u.id LEFT JOIN "TaskInstance" t ON t."userId"=u.id AND t.status<>'REPLACED'
      WHERE u.role='participant' AND (u.name ILIKE $1 OR u.email ILIKE $1)
      GROUP BY u.id,l.user_id ORDER BY u."createdAt" DESC LIMIT 20 OFFSET $2`,[pattern,(page-1)*20]),
    db().query(`SELECT count(*)::int AS count FROM "User" u WHERE role='participant' AND (u.name ILIKE $1 OR u.email ILIKE $1)`,[pattern]),
    db().query(`SELECT t.id,t.title,t.sphere,t."localDate",t.status,t.variant,u.id AS user_id,u.name,u.email
      FROM "TaskInstance" t JOIN "User" u ON u.id=t."userId"
      WHERE u.role='participant' AND (u.name ILIKE $1 OR u.email ILIKE $1) AND ($2='all' OR t.status::text=$2)
      ORDER BY t."localDate" DESC,t."createdAt" DESC LIMIT 20 OFFSET $3`,[pattern,status,(page-1)*20]),
    db().query(`SELECT count(*)::int AS count FROM "TaskInstance" t JOIN "User" u ON u.id=t."userId" WHERE u.role='participant' AND (u.name ILIKE $1 OR u.email ILIKE $1) AND ($2='all' OR t.status::text=$2)`,[pattern,status]),
    db().query(`SELECT d.day::date::text AS day,
      (SELECT count(*)::int FROM "User" u WHERE u.role='participant' AND u."createdAt">=d.day AND u."createdAt"<d.day+interval '1 day') AS registrations,
      (SELECT count(*)::int FROM "TaskReport" r JOIN "User" u ON u.id=r."userId" WHERE u.role='participant' AND r."createdAt">=d.day AND r."createdAt"<d.day+interval '1 day') AS reports
      FROM generate_series(date_trunc('day',now())-interval '13 days',date_trunc('day',now()),interval '1 day') d(day) ORDER BY d.day`),
  ]);
  return NextResponse.json({stats:results[0].rows[0],participants:results[1].rows,participantCount:results[2].rows[0].count,tasks:results[3].rows,taskCount:results[4].rows[0].count,daily:results[5].rows,page});
});
