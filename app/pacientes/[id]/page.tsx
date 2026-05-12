import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Mail,
  Calendar,
  Clock,
  Brain,
  Sparkles,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TranscricaoCompleta from "@/components/TranscricaoCompleta";

export const dynamic = "force-dynamic";

export default async function PacienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: paciente } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("psicologa_id", user.id)
    .maybeSingle();

  if (!paciente) notFound();

  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("*")
    .eq("paciente_id", params.id)
    .eq("psicologa_id", user.id)
    .order("data_agendada", { ascending: false });

  const sessaoIds = (sessoes || []).map((s) => s.id);

  const { data: resumos } =
    sessaoIds.length > 0
      ? await supabase
          .from("resumos_ia")
          .select("*")
          .in("sessao_id", sessaoIds)
      : { data: [] };

  const { data: transcricoes } =
    sessaoIds.length > 0
      ? await supabase
          .from("transcricoes")
          .select("*")
          .in("sessao_id", sessaoIds)
          .order("timestamp_segundos", { ascending: true })
      : { data: [] };

  const resumosPorSessao: Record<string, any> = {};
  (resumos || []).forEach((r) => {
    resumosPorSessao[r.sessao_id] = r;
  });

  const transcricoesPorSessao: Record<string, any[]> = {};
  (transcricoes || []).forEach((t) => {
    if (!transcricoesPorSessao[t.sessao_id]) {
      transcricoesPorSessao[t.sessao_id] = [];
    }
    transcricoesPorSessao[t.sessao_id].push(t);
  });

  const totalSessoes = sessoes?.length ?? 0;
  const sessoesConcluidas = (sessoes || []).filter(
    (s) => s.status === "concluida"
  ).length;

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatarHora(data: string) {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function calcularDuracao(inicio: string | null, fim: string | null) {
    if (!inicio || !fim) return null;
    const ms = new Date(fim).getTime() - new Date(inicio).getTime();
    const minutos = Math.round(ms / 60000);
    return minutos + " min";
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/pacientes"
          className="flex items-center gap-2 mb-6 text-sm text-lavender-600"
        >
          <ChevronLeft size={16} />
          <span>Voltar para pacientes</span>
        </Link>

        <header className="flex items-start gap-6 mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-serif"
            style={{ background: "#a78bca" }}
          >
            {paciente.nome_completo[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl mb-1 font-serif text-lavender-800">
              {paciente.nome_completo}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-lavender-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                <span>{paciente.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{totalSessoes} sessoes registradas</span>
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 rounded-2xl p-5 border border-lavender-300/20">
            <div className="text-3xl font-serif text-lavender-800">
              {totalSessoes}
            </div>
            <div className="text-xs text-lavender-700 mt-1">
              Sessoes totais
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl p-5 border border-lavender-300/20">
            <div className="text-3xl font-serif text-lavender-800">
              {sessoesConcluidas}
            </div>
            <div className="text-xs text-lavender-700 mt-1">
              Sessoes concluidas
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl p-5 border border-lavender-300/20">
            <div className="text-3xl font-serif text-lavender-800">
              {Object.keys(resumosPorSessao).length}
            </div>
            <div className="text-xs text-lavender-700 mt-1">
              Resumos da IA
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl p-6 border border-lavender-300/20">
          <h3 className="font-serif text-2xl text-lavender-800 mb-4">
            Historico de sessoes
          </h3>

          {!sessoes || sessoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm italic text-lavender-600">
                Nenhuma sessao registrada ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessoes.map((s) => {
                const resumo = resumosPorSessao[s.id];
                const transcricoesSessao = transcricoesPorSessao[s.id] || [];
                const duracao = calcularDuracao(s.iniciada_em, s.finalizada_em);

                return (
                  <div
                    key={s.id}
                    className="border border-lavender-300/30 rounded-2xl p-5 bg-white/60"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-serif text-lg text-lavender-800">
                          {formatarData(s.data_agendada)}
                        </div>
                        <div className="text-xs text-lavender-600 flex items-center gap-3 mt-1">
                          {s.iniciada_em && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatarHora(s.iniciada_em)}
                            </span>
                          )}
                          {duracao && <span>{duracao}</span>}
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
                            style={{
                              background:
                                s.status === "concluida"
                                  ? "rgba(125, 167, 125, 0.15)"
                                  : s.status === "em_andamento"
                                  ? "rgba(193, 74, 74, 0.15)"
                                  : "rgba(167, 139, 202, 0.15)",
                              color:
                                s.status === "concluida"
                                  ? "#3d6b3d"
                                  : s.status === "em_andamento"
                                  ? "#a13434"
                                  : "#5d4470",
                            }}
                          >
                            {s.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {resumo ? (
                      <div className="mt-4 space-y-3 pt-4 border-t border-lavender-300/20">
                        {resumo.tema_principal && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-lavender-400 mb-1 flex items-center gap-1.5">
                              <Sparkles size={10} /> Tema principal
                            </div>
                            <div className="text-sm font-serif text-lavender-900">
                              {resumo.tema_principal}
                            </div>
                          </div>
                        )}

                        {resumo.pontos_principais &&
                          resumo.pontos_principais.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-lavender-400 mb-2">
                                Pontos da sessao
                              </div>
                              <div className="space-y-1">
                                {resumo.pontos_principais.map(
                                  (p: string, i: number) => (
                                    <div
                                      key={i}
                                      className="flex items-start gap-2 text-sm text-lavender-800"
                                    >
                                      <CheckCircle2
                                        size={13}
                                        className="mt-0.5 flex-shrink-0 text-lavender-600"
                                      />
                                      <span>{p}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {resumo.insights && resumo.insights.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-lavender-400 mb-2 flex items-center gap-1.5">
                              <Brain size={10} /> Insights
                            </div>
                            <div className="space-y-2">
                              {resumo.insights.map((ins: any, i: number) => (
                                <div
                                  key={i}
                                  className="rounded-xl p-3 text-xs"
                                  style={{
                                    background:
                                      ins.tipo === "alerta"
                                        ? "rgba(193, 74, 74, 0.08)"
                                        : "rgba(167, 139, 202, 0.1)",
                                  }}
                                >
                                  <div className="text-[9px] uppercase tracking-wider mb-1 text-lavender-700">
                                    {ins.tipo} - {ins.confianca}% confianca
                                  </div>
                                  <div className="text-lavender-900">
                                    {ins.texto}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {resumo.sugestoes_proxima_sessao && (
                          <div className="rounded-xl p-3 bg-lavender-100">
                            <div className="text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 text-lavender-700">
                              <Sparkles size={10} /> Proxima sessao
                            </div>
                            <div className="text-xs italic text-lavender-900">
                              {resumo.sugestoes_proxima_sessao}
                            </div>
                          </div>
                        )}

                        {resumo.notas_psicologa && (
                          <div className="rounded-xl p-3 bg-yellow-50 border border-yellow-200">
                            <div className="text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 text-yellow-700">
                              <FileText size={10} /> Suas notas
                            </div>
                            <div className="text-xs text-yellow-900 whitespace-pre-wrap">
                              {resumo.notas_psicologa}
                            </div>
                          </div>
                        )}

                        {transcricoesSessao.length > 0 && (
                          <TranscricaoCompleta
                            trechos={transcricoesSessao}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="text-xs italic text-lavender-500 mb-3">
                          Sem resumo da IA para esta sessao.
                        </div>
                        {transcricoesSessao.length > 0 && (
                          <TranscricaoCompleta
                            trechos={transcricoesSessao}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
