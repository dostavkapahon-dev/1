import { redirect } from "next/navigation";
import { currentMember } from "../../lib/session";
import Dashboard from "../dashboard";
export const dynamic = "force-dynamic";
export default async function DashboardPage() { if (!await currentMember()) redirect("/login"); return <Dashboard />; }
