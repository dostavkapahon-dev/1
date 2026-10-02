import { NextResponse } from "next/server";
import { api } from "../../../../lib/http";
import { requireMember } from "../../../../lib/session";
import { db } from "../../../../lib/db";

export const GET=api(async()=>{
  const user=await requireMember();
  const [tasks,reports,snapshots]=await Promise.all([
    db().query(`SELECT * FROM "TaskInstance" WHERE "userId"=$1`,[user.id]),
    db().query(`SELECT * FROM "TaskReport" WHERE "userId"=$1`,[user.id]),
    db().query(`SELECT * FROM monthly_snapshots WHERE user_id=$1`,[user.id]),
  ]);
  return NextResponse.json({exportedAt:new Date().toISOString(),user,tasks:tasks.rows,reports:reports.rows,snapshots:snapshots.rows},{headers:{"Content-Disposition":'attachment; filename="ideal-year-export.json"'}});
});
