import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result=await db().query("SELECT count(*)::int AS count FROM app_migrations");
    const ready=result.rows[0].count>=2;
    return NextResponse.json({status:ready?"ready":"degraded"},{status:ready?200:503,headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({status:"degraded"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
