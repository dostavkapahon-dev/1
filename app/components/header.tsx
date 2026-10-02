"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "../../lib/client";

export default function Header({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return <header className="site-header"><Link className="brand" href="/dashboard"><span className="brand-mark">◒</span> Идеальный год</Link><nav aria-label="Основная навигация"><Link href="/dashboard">Мой кабинет</Link>{admin && <Link href="/admin">Участники</Link>}<button className="text-button" onClick={async () => { try { await requestJson("/api/auth/logout", "POST", {}); router.push("/"); router.refresh(); } catch (e) { setError((e as Error).message); } }}>Выйти</button></nav>{error && <p role="alert">{error}</p>}</header>;
}
