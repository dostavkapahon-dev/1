"use client";

import { useEffect, useMemo, useState } from "react";
import { labelForVariant, spheres, starterQuestions, taskCatalog, type Sphere, type Variant } from "../lib/domain";

type StoredState = { name: string; scores: Array<number | null>; answers: string[]; focus: Sphere; variant: Variant; reported: boolean; note: string };
const key = "ideal-year-pilot-v1";
const empty: StoredState = { name: "", scores: Array(12).fill(null), answers: Array(3).fill(""), focus: "Сон и энергия", variant: "normal", reported: false, note: "" };

export default function Dashboard() {
  const [state, setState] = useState<StoredState>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => { const raw = localStorage.getItem(key); if (raw) setState(JSON.parse(raw)); setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(state)); }, [state, ready]);
  const answered = state.scores.filter((score) => score !== null).length;
  const average = useMemo(() => { const values = state.scores.filter((x): x is number => x !== null); return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "—"; }, [state.scores]);
  const setScore = (index: number, score: number | null) => setState((s) => ({ ...s, scores: s.scores.map((item, i) => i === index ? score : item) }));
  const todayTask = taskCatalog[state.focus];

  return <main>
    <header><div><p className="eyebrow">30-дневный пилот</p><h1>Идеальный год</h1></div><p className="muted">Один посильный шаг сегодня.</p></header>
    <section className="welcome"><label>Как к вам обращаться?<input value={state.name} placeholder="Ваше имя" onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}/></label><p>{state.name ? `${state.name}, ` : ""}здесь нет гонки за идеальной оценкой. Вы выбираете то, что важно вам.</p></section>
    <section className="card onboarding"><p className="eyebrow">Стартовый фокус</p><h2>Три вопроса для вашего маршрута</h2>{starterQuestions.map((question, index) => <label key={question}>{question}<textarea value={state.answers[index]} onChange={(e) => setState((s) => ({ ...s, answers: s.answers.map((answer, i) => i === index ? e.target.value : answer) }))} placeholder="Можно ответить коротко или вернуться позже" /></label>)}<label>На какой сфере хотите сосредоточиться сначала?<select value={state.focus} onChange={(e) => setState((s) => ({ ...s, focus: e.target.value as Sphere, reported: false }))}>{spheres.map((sphere) => <option key={sphere}>{sphere}</option>)}</select></label></section>
    <section className="grid">
      <article className="card task"><p className="eyebrow">Сегодня · {todayTask.sphere}</p><h2>{todayTask.title}</h2><div className="variants">{(["minimum", "normal", "expanded"] as Variant[]).map((variant) => <button className={state.variant === variant ? "selected" : ""} key={variant} onClick={() => setState((s) => ({ ...s, variant }))}><strong>{labelForVariant(variant)}</strong><span>{todayTask.variants[variant]}</span></button>)}</div>
        {state.reported ? <p className="success">Отчёт сохранён. Завтра можно выбрать следующий шаг.</p> : <><label>Короткая заметка (необязательно)<textarea value={state.note} onChange={(e) => setState((s) => ({ ...s, note: e.target.value }))} placeholder="Что получилось или что хотите изменить?" /></label><button className="primary" onClick={() => setState((s) => ({ ...s, reported: true }))}>Отметить результат</button></>}
      </article>
      <article className="card"><p className="eyebrow">Колесо баланса</p><h2>{average} <span className="muted">средняя личная оценка</span></h2><p className="muted">Заполнено сфер: {answered} из 12. Оценка — снимок вашего состояния, не оценка личности.</p><div className="scores">{spheres.map((sphere, index) => <label key={sphere}><span>{sphere}</span><div>{Array.from({ length: 11 }, (_, score) => <button aria-label={`${sphere}: ${score}`} className={state.scores[index] === score ? "score active" : "score"} onClick={() => setScore(index, state.scores[index] === score ? null : score)} key={score}>{score}</button>)}</div></label>)}</div>
      </article>
    </section>
    <section className="card next"><h2>Что уже готово в этой версии</h2><p>Опрос по 12 сферам, выбор посильной нагрузки и отчёт о задаче. Данные пока сохраняются только в этом браузере: серверная авторизация, синхронизация и Telegram — следующий этап.</p><button className="secondary" onClick={() => { localStorage.removeItem(key); setState(empty); }}>Начать заново</button></section>
  </main>;
}
