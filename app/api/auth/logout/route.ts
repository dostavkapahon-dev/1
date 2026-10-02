import { NextResponse } from "next/server";
import { api, requireOrigin } from "../../../../lib/http";
import { db } from "../../../../lib/db";
import { digest } from "../../../../lib/security";
import { cookieName } from "../../../../lib/session";

export const POST = api(async request => {
  requireOrigin(request);
  const token = request.cookies.get(cookieName)?.value;
  if (token) await db().query(`DELETE FROM "Session" WHERE "sessionToken"=$1`, [digest(token)]);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  return response;
});
