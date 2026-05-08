import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  Brain,
  Clock,
  ChevronRight,
  ArrowRight,
  Video,
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
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/40 text-lavender-700"
          >
            <Users size={18} />
            <span>Pacientes</span>
          </Link>
        </nav>

        <div className="space-y-1 pt-4 border-t border-lavender-300/20">
          <LogoutButton />

          <div className="mt-3 p-3 rounded-xl flex items-center gap-3 bg-lavender-200/30">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-serif"
              style={{
                background: "linear-gradient(135deg, #a78bca, #7a5d8e)",
              }}
            >
              {profile.nome_completo[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate text-lavender-800">
                {profile.nome_completo}
              </div>
              <div className="text-[10px] text-lavender-600">
                {profile.crp ? "CRP " + profile.crp : "Psicologa"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl">
          <header className="mb-8">
            <div className="text-xs uppercase tracking-[0.3em] mb-2 text-lavender-400">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <h1 className="text-4xl mb-2 font-serif text-lavender-800">
              Ola, <em className="font-light">{primeiroNome}</em>
            </h1>
            <p className="text-lavender-600">
              {totalPacientes === 0
                ? "Voce ainda nao tem pacientes cadastrados."
                : "Voce tem " + totalPacientes + " pacientes em acompanhamento."}
            </p>
          </header>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Pacientes ativos", valor: totalPacientes, icone: Users },
              { label: "Sessoes esta semana", valor: 0, ic
