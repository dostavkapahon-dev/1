import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { digest } from "./security";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function api(fn: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const response = await fn(request);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (e) {
      const id = randomUUID();
      if (!(e instanceof HttpError) && !(e instanceof ZodError)) console.error("Request failed", id, (e as { code?: string }).code ?? "internal");
      return NextResponse.json({ error: e instanceof HttpError ? e.message : e instanceof ZodError ? "Проверьте заполненные поля." : "Сервис временно недоступен. Попробуйте позже.", requestId: id }, { status: e instanceof HttpError ? e.status : e instanceof ZodError ? 400 : 503, headers: { "Cache-Control": "no-store" } });
    }
  };
}
export function requireOrigin(request: NextRequest) {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new HttpError(503, "Администратору нужно настроить адрес сайта.");
  if (request.headers.get("origin") !== new URL(origin).origin) throw new HttpError(403, "Недопустимый источник запроса.");
}
export async function body<T>(request: NextRequest, schema: ZodType<T>) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new HttpError(415, "Ожидается JSON.");
  const text = await request.text();
  if (Buffer.byteLength(text) > 20000) throw new HttpError(413, "Слишком длинный запрос.");
  try { return schema.parse(JSON.parse(text)); }
  catch (e) { if (e instanceof ZodError) throw e; throw new HttpError(400, "Некорректный JSON."); }
}
export async function rateLimit(scope: string, identity: string, limit: number, seconds: number) {
  const { rows } = await db().query(`INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,now()+$2*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END,
    reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+$2*interval '1 second' ELSE rate_limits.reset_at END RETURNING count`, [digest(`${scope}:${identity}`), seconds]);
  if (rows[0].count > limit) throw new HttpError(429, "Слишком много попыток. Попробуйте позже.");
}
