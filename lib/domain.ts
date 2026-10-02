export const spheres = [
  "Здоровье", "Движение", "Сон и энергия", "Эмоциональное благополучие",
  "Партнёрство и близость", "Семья", "Окружение", "Финансы",
  "Дело и вклад", "Познание и творчество", "Духовность и смысл", "Дом и отдых",
] as const;

export type Sphere = (typeof spheres)[number];
export type Variant = "minimum" | "normal" | "expanded";

export type TodayTask = {
  sphere: Sphere;
  title: string;
  variants: Record<Variant, string>;
};

export const demoTask: TodayTask = {
  sphere: "Сон и энергия",
  title: "Подготовить спокойное завершение дня",
  variants: {
    minimum: "За 2 минуты запишите, что сегодня поддержало вашу энергию.",
    normal: "За 10 минут выключите уведомления на вечер и подготовьте спокойное завершение дня.",
    expanded: "За 25 минут составьте реалистичный вечерний ритуал на ближайшие три дня.",
  },
};

export function validateScores(scores: Array<number | null>) {
  return scores.length === spheres.length && scores.every((value) => value === null || (Number.isInteger(value) && value >= 0 && value <= 10));
}

export function labelForVariant(variant: Variant) {
  return { minimum: "Минимум", normal: "Обычный", expanded: "Расширенный" }[variant];
}
