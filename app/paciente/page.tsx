import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Shield,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import VincularPsicologa from "@/components/VincularPsicologa";

export default async function PacientePage() {
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

  if (!profile) redirect("/auth/login");
  if (profile.role !== "paciente") redirect("/dashboard");

  let psicologa = null;
  if (profile.psicologa_id) {
    const { data } = await supabase
      .from("profiles")
      .select("nome_completo, crp")
      .eq("id", profile.psicologa_id)
      .single();
    psicologa = data;
  }

  const { data: proximaSessao } = await supabase
    .from("sessoes")
    .select("*")
    .eq("paciente_id", user.id)
    .eq("status", "agendada")
    .order("data_agendada", { ascending: true })
    .limit(1)
    .single();

  const primeiroNome = profile.nome_completo.split(" ")[0];

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="font-serif text-xl text-lavender-800 tracking-widest">
            SINTONIA
          </div>
        </div>
        <div className="w-32">
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.3em] mb-3 text-lavender-400">
            seja bem-vinda
          </div>
          <h1 className="text-5xl mb-3 font-serif text-lavender-800">
            Olá, <em className="font-light">{primeiroNome}</em>
          </h1>
        </div>

        {!psicologa ? (
          <VincularPsicologa pacienteId={user.id} />
        ) : (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6 border border-lavender-300/30">
              <div className="text-xs uppercase tracking-wider text-lavender-400 mb-4">
                Sua psicóloga
              </div>

              <div className="flex items-center gap-5 mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl flex-shrink-0 font-serif"
                  style={{
                    background:
                      "linear-gradient(135deg, #a78bca, #5d4470)",
                  }}
                >
                  {psicologa.nome_completo[0]}
                </div>
                <div>
                  <div className="text-2xl font-serif text-lavender-800">
                    {psicologa.nome_completo}
                  </div>
                  <div className="text-sm text-lavender-600">
                    Psicóloga{" "}
                    {psicologa.crp ? `· CRP ${psicologa.crp}` : ""}
                  </div>
                </div>
              </div>

              {proximaSessao ? (
                <div className="bg-lavender-200/20 rounded-xl p-4 mb-4">
                  <div className="text-xs uppercase tracking-wider text-lavender-600 mb-2">
                    Próxima sessão
                  </div>
                  <div className="flex items-center gap-3 text-sm text-lavender-800">
                    <Calendar size={14} />
                    {new Date(proximaSessao.data_agendada).toLocaleString(
                      "pt-BR"
                    )}
                    <Clock size={14} className="ml-2" />
                    {proximaSessao.duracao_minutos} min
                  </div>
                </div>
              ) : (
                <div className="bg-lavender-200/20 rounded-xl p-4 mb-4">
                  <p className="text-sm italic text-lavender-700">
                    Nenhuma sessão agendada. Sua psicóloga vai agendar quando
                    estiverem prontas.
                  </p>
                </div>
              )}

              <button
                disabled
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed bg-lavender-300 text-cream"
              >
                Entrar na sessão (disponível na Parte 2)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-lavender-300/20">
                <BookOpen size={20} className="text-lavender-700" />
                <div className="mt-3 font-serif text-lg text-lavender-800">
                  Diário de humor
                </div>
                <div className="text-xs mt-1 text-lavender-600">
                  Em breve
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-lavender-300/20">
                <ClipboardList size={20} className="text-lavender-700" />
                <div className="mt-3 font-serif text-lg text-lavender-800">
                  Tarefas
                </div>
                <div className="text-xs mt-1 text-lavender-600">
                  Em breve
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-lavender-300/20">
                <Calendar size={20} className="text-lavender-700" />
                <div className="mt-3 font-serif text-lg text-lavender-800">
                  Histórico
                </div>
                <div className="text-xs mt-1 text-lavender-600">
                  Em breve
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-10 text-xs flex items-center justify-center gap-4 text-lavender-600">
          <span className="flex items-center gap-1">
            <Lock size={11} /> Seguro
          </span>
          <span className="flex items-center gap-1">
            <Shield size={11} /> Ético
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} /> Sigiloso
          </span>
        </div>
      </div>
    </div>
  );
}
