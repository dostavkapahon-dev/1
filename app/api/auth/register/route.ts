import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { api, body, HttpError, rateLimit, requireOrigin } from "../../../../lib/http";
import { signupSchema } from "../../../../lib/validation";
import { digest, hashPassword, randomToken, secretsEqual } from "../../../../lib/security";
import { db } from "../../../../lib/db";
import { issueSession } from "../../../../lib/session";

export const POST = api(async request => {
  requireOrigin(request);
  await rateLimit("register", "global", 100, 3600);
  const input = await body(request, signupSchema);
  const hash = await hashPassword(input.password);
  const recoveryCode = randomToken();
  const id = randomUUID();
  const organizerSecret = process.env.OWNER_INVITE_CODE;
  const role = organizerSecret && input.organizerCode && secretsEqual(input.organizerCode, organizerSecret) ? "admin" : "participant";
  try {
    await db().query(`INSERT INTO "User"(id,name,email,timezone,password_hash,recovery_hash,role,consent_version,consent_at,"updatedAt") VALUES($1,$2,$3,$4,$5,$6,$7,'2026-10-02',now(),now())`, [id,input.name,input.email,input.timezone,hash,digest(recoveryCode),role]);
  } catch(e) {
    if ((e as {code?: string}).code === "23505") throw new HttpError(409, "Не удалось зарегистрировать этот email. Попробуйте войти или восстановить доступ.");
    throw e;
  }
  const response = NextResponse.json({ recoveryCode }, { status: 201 });
  await issueSession(id, response);
  return response;
});
