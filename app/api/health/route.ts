import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({
    status: databaseConfigured ? "ready" : "degraded",
    service: "ideal-year",
    checks: { database: databaseConfigured ? "configured" : "missing DATABASE_URL" },
  }, { status: databaseConfigured ? 200 : 503 });
}
