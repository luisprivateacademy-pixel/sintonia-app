import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  Brain,
  Clock,
  ChevronRight,
  ArrowRight,
  Plus,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

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
    .single();

  if (!profile || profile.role !== "psicologa") {
    redirect("/paciente");
  }

  const { data: pacientes } = await supabase
    .from("profiles")
    .select("*")
    .eq("psicologa_id", user.id)
    .eq("role", "paciente")
    .order("created_at", { ascending: false });

  const { data: proximasSessoes } = await supabase
    .from("sessoes")
    .select("*, paciente:profiles!sessoes_paciente_id_fkey(nome_completo)")
    .eq("psicologa_id", user.id)
    .eq("status", "agendada")
    .order("data_agendada", { ascending: true })
    .limit(5);

  const totalPacientes = pacientes?.length ?? 0;
  const sessoesHoje = proximasSessoes?.filter((s) => {
    const data = new Date(s.data_agendada);
    const hoje = new Date();
    return data.toDateString() === hoje.toDateString();
  }).length ?? 0;

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
            <Users size={18} /> Início
          </Link>
          <Link
            href="/pacientes"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/40 text-lavender-700"
          >
            <Users size={18} /> Pacientes
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
                {profile.crp ? `CRP ${profile.crp}` : "Psicóloga"}
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
              Bom dia, <em className="font-light">{primeiroNome}</em>
            </h1>
            <p className="text-lavender-600">
              Você tem {sessoesHoje} {sessoesHoje === 1 ? "sessão hoje" : "sessões hoje"}.
            </p>
          </header>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Pacientes ativos", valor: totalPacientes, icone: Users },
              { label: "Próximas sessões", valor: proximasSessoes?.length ?? 0, icone: Calendar },
              { label: "Sessões hoje", valor: sessoesHoje, icone: Clock },
              { label: "Insights gerados", valor: "—", icone: Brain },
            ].map((m, i) => {
              const Icon = m.icone;
              return (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-lavender-300/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-lavender-200/30">
                      <Icon size={18} className="text-lavender-700" />
                    </div>
                  </div>
                  <div className="text-3xl mb-1 font-serif text-lavender-800">
                    {m.valor}
                  </div>
                  <div className="text-xs text-lavender-700">{m.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-lavender-300/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-lavender-800">
                  Próximas sessões
                </h3>
                <Link
                  href="/pacientes"
                  className="text-xs flex items-center gap-1 text-lavender-600"
                >
                  Ver pacientes <ArrowRight size={12} />
                </Link>
              </div>

              {!proximasSessoes || proximasSessoes.length === 0 ? (
                <div className="text-center py-12 text-sm italic text-lavender-600">
                  Nenhuma sessão agendada ainda. Quando seus pacientes
                  agendarem, elas aparecerão aqui.
                </div>
              ) : (
                <div className="space-y-2">
                  {proximasSessoes.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium font-serif"
                        style={{ background: "#a78bca" }}
                      >
                        {s.paciente?.nome_completo?.[0] ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-lavender-800">
                          {s.paciente?.nome_completo}
                        </div>
                        <div className="text-xs text-lavender-600">
                          {new Date(s.data_agendada).toLocaleString("pt-BR")}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-lavender-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-lavender-300/20">
              <h3 className="mb-4 font-serif text-2xl text-lavender-800">
                Pacientes recentes
              </h3>
              {!pacientes || pacientes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs italic text-lavender-600 mb-4">
                    Quando alguém se cadastrar como seu paciente, aparecerá
                    aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pacientes.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      href={`/pacientes/${p.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-serif"
                        style={{ background: "#a78bca" }}
                      >
                        {p.nome_completo[0]}
                      </div>
                      <span className="text-sm text-lavender-800">
                        {p.nome_completo}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
