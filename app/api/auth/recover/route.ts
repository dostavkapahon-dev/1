import { z } from "zod";
import { NextResponse } from "next/server";
import { api, body, HttpError, rateLimit, requireOrigin } from "../../../../lib/http";
import { email, password } from "../../../../lib/validation";
import { digest, hashPassword, randomToken } from "../../../../lib/security";
import { transaction } from "../../../../lib/db";
import { cookieName } from "../../../../lib/session";

export const POST = api(async request => {
  requireOrigin(request);
  const input = await body(request, z.object({email, password, recoveryCode:z.string().min(20).max(100)}).strict());
  await rateLimit("recover", input.email, 5, 3600);
  await rateLimit("recover-global", "global", 100, 3600);
  const hash = await hashPassword(input.password), recoveryCode = randomToken();
  await transaction(async client => {
    const result = await client.query(`UPDATE "User" SET password_hash=$1,recovery_hash=$2,"updatedAt"=now() WHERE lower(email)=$3 AND recovery_hash=$4 RETURNING id`, [hash,digest(recoveryCode),input.email,digest(input.recoveryCode)]);
    if (!result.rowCount) throw new HttpError(400,"Неверный email или код восстановления.");
    await client.query(`DELETE FROM "Session" WHERE "userId"=$1`, [result.rows[0].id]);
  });
  const response = NextResponse.json({ recoveryCode });
  response.cookies.set(cookieName,"",{path:"/",maxAge:0});
  return response;
});
