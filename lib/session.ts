import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { digest, randomToken } from "./security";
import { HttpError } from "./http";

export type Member = { id: string; email: string; name: string; role: "participant" | "admin"; timezone: string; focus: string; goal: string; answers: string[]; scores: (number|null)[]; onboarded: boolean; paused: boolean; createdAt: string };
export const cookieName = "ideal_year_session";
export async function currentMember(): Promise<Member | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const { rows } = await db().query(`SELECT u.id,u.email,u.name,u.role,u.timezone,u.focus,u.goal,u.answers,u.scores,u.onboarded,u.paused,u."createdAt"
    FROM "Session" s JOIN "User" u ON u.id=s."userId" WHERE s."sessionToken"=$1 AND s.expires>now()`, [digest(token)]);
  return rows[0] ?? null;
}
export async function requireMember(admin = false) {
  const user = await currentMember();
  if (!user) throw new HttpError(401, "Войдите в свой кабинет.");
  if (admin && user.role !== "admin") throw new HttpError(403, "Доступ только для администратора.");
  return user;
}
export async function issueSession(userId: string, response: NextResponse) {
  const token = randomToken();
  await db().query(`DELETE FROM "Session" WHERE "userId"=$1 AND expires<now()`, [userId]);
  await db().query(`INSERT INTO "Session"(id,"sessionToken","userId",expires) VALUES($1,$2,$3,now()+interval '14 days')`, [randomUUID(), digest(token), userId]);
  response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.APP_ORIGIN?.startsWith("https://") ?? false, sameSite: "lax", path: "/", maxAge: 14*86400 });
}
