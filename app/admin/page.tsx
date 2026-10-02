import { redirect } from "next/navigation";
import { currentMember } from "../../lib/session";
import Admin from "./view";
export const dynamic = "force-dynamic";
export default async function AdminPage() { const user = await currentMember(); if (!user) redirect("/login"); if (user.role !== "admin") redirect("/dashboard"); return <Admin />; }
