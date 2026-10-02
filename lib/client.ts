export async function requestJson<T>(path: string, method = "GET", data?: unknown, headers?: Record<string, string>): Promise<T> {
  const response = await fetch(path, { method, cache: "no-store", headers: { ...(data !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Не удалось выполнить запрос.");
  return result as T;
}

export const statusLabels: Record<string, string> = { OFFERED: "Ожидает", ACCEPTED: "Принята", COMPLETED: "Выполнено", PARTIAL: "Частично", SKIPPED: "Пропущено", REPLACED: "Заменена" };
