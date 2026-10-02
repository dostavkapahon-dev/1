import { NextResponse } from "next/server";
import { api, body, HttpError, rateLimit, requireOrigin } from "../../../../lib/http";
import { loginSchema } from "../../../../lib/validation";
import { verifyPassword } from "../../../../lib/security";
import { db } from "../../../../lib/db";
import { issueSession } from "../../../../lib/session";

export const POST = api(async request => {
  requireOrigin(request);
  const input = await body(request, loginSchema);
  await rateLimit("login", "global", 300, 900);
  await rateLimit("login-email", input.email, 10, 900);
  const { rows } = await db().query(`SELECT id,password_hash FROM "User" WHERE lower(email)=$1`, [input.email]);
  const fallback = `scrypt:00000000000000000000000000000000:${"0".repeat(128)}`;
  const valid = await verifyPassword(input.password, rows[0]?.password_hash ?? fallback);
  if (!rows[0] || !valid) throw new HttpError(401, "Неверный email или пароль.");
  await db().query(`UPDATE "User" SET last_seen_at=now() WHERE id=$1`, [rows[0].id]);
  const response = NextResponse.json({ ok: true });
  await issueSession(rows[0].id, response);
  return response;
});
