import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  Brain,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import IniciarSessaoButton from "@/components/IniciarSessaoButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/");
  if (profile.role !== "psicologa") redirect("/paciente");

  const { data: pacientes } = await supabase
    .from("profiles")
    .select("*")
    .eq("psicologa_id", user.id)
    .eq("role", "paciente")
    .order("created_at", { ascending: false });

  // Conta sessoes da semana
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  const { count: sessoesSemana } = await supabase
    .from("sessoes")
    .select("*", { count: "exact", head: true })
    .eq("psicologa_id", user.id)
    .gte("data_agendada", inicioSemana.toISOString());

  // Conta insights gerados
  const { count: totalInsights } = await supabase
    .from("resumos_ia")
    .select("*", { count: "exact", head: true });

  const totalPacientes = pacientes?.length ?? 0;
  const primeiroNome = profile.nome_completo.split(" ")[0];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 min-h-screen flex flex-col py-6 px-4 bg-gradient-to-b from-cream to-lavender-100/50 border-r border-lavender-300/20">
        <div className="flex items-center gap-3 px-2 mb-8">
          <Logo size="sm" />
          <div>
            <div className="font-serif text-xl text-lavender-800 tracking-widest">
              SINTONIA
            </div>
            <div className="text-[10px] tracking-wider uppercase text-lavender-600">
              painel pro
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm shadow-md text-cream"
            style={{
              background: "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
            }}
          >
            <Users size={18} />
            <span>Inicio</span>
          </Link>
          <Link
            href="/pacientes"
