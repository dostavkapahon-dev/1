import { NextResponse } from "next/server";
import { api } from "../../../lib/http";
import { requireMember } from "../../../lib/session";
import { todayTask, recentTasks } from "../../../lib/tasks";
import { db } from "../../../lib/db";

export const GET=api(async()=>{
  const user=await requireMember();
  const task=await todayTask(user);
  const [history,snapshots,links,pending]=await Promise.all([
    recentTasks(user.id),
    db().query(`SELECT id,scores,created_at FROM monthly_snapshots WHERE user_id=$1 ORDER BY created_at DESC LIMIT 24`,[user.id]),
    db().query(`SELECT linked_at FROM telegram_links WHERE user_id=$1`,[user.id]),
    db().query(`SELECT candidate_name,expires_at FROM telegram_link_requests WHERE user_id=$1 AND expires_at>now() AND candidate_id IS NOT NULL`,[user.id]),
  ]);
  return NextResponse.json({user,task,history,snapshots:snapshots.rows,telegram:{available:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_BOT_USERNAME&&process.env.TELEGRAM_WEBHOOK_SECRET),connected:links.rowCount!>0,pending:pending.rows[0]??null}});
});
