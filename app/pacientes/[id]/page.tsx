import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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
    .single();

  if (!profile || profile.role !== "psicologa") redirect("/paciente");

  const { data: paciente } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("psicologa_id", user.id)
    .single();

  if (!paciente) notFound();

  const { data: info } = await supabase
    .from("pacientes_info")
    .select("*")
    .eq("paciente_id", params.id)
    .single();

  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("*")
    .eq("paciente_id", params.id)
    .order("data_agendada", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/pacientes"
          className="flex items-center gap-2 mb-6 text-sm text-lavender-600"
        >
          <ChevronLeft size={16} /> Voltar para pacientes
        </Link>

        <header className="flex items-start gap-6 mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl flex-shrink-0 font-serif"
            style={{ background: "#a78bca" }}
          >
            {paciente.nome_completo
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl mb-1 font-serif text-lavender-800">
              {paciente.nome_completo}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-lavender-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {paciente.email}
              </span>
              {paciente.telefone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} /> {paciente.telefone}
                </span>
              )}
              {paciente.data_nascimento && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />{" "}
                  {new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-lavender-300/20">
              <h3 className="font-serif text-xl text-lavender-800 mb-3">
                Anamnese
              </h3>
              {info?.queixa_principal ? (
                <div className="space-y-3 text-sm text-lavender-800 leading-relaxed">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-lavender-400 mb-1">
                      Queixa principal
                    </div>
                    <p>{info.queixa_principal}</p>
                  </div>
                  {info.historia_clinica && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-lavender-400 mb-1">
                        História clínica
                      </div>
                      <p>{info.historia_clinica}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm italic text-lavender-600">
                  Anamnese ainda não preenchida. Será coletada na primeira
                  sessão (disponível na Parte 2).
                </p>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-lavender-300/20">
              <h3 className="font-serif text-xl text-lavender-800 mb-3">
                Sessões
              </h3>
              {!sessoes || sessoes.length === 0 ? (
                <p className="text-sm italic text-lavender-600">
                  Nenhuma sessão registrada ainda. A funcionalidade de
                  videochamada será adicionada na Parte 2.
                </p>
              ) : (
                <div className="space-y-2">
                  {sessoes.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60"
                    >
                      <div className="text-center px-3 py-1 rounded-lg bg-lavender-200/30">
                        <div className="text-lg font-serif text-lavender-800">
                          {new Date(s.data_agendada).getDate()}
                        </div>
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="text-lavender-800">
                          Sessão{" "}
                          {new Date(s.data_agendada).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-xs text-lavender-600">
                          Status: {s.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-lavender-300/20">
              <div className="text-xs uppercase tracking-wider text-lavender-400 mb-3">
                Temas recorrentes
              </div>
              {info?.temas_recorrentes && info.temas_recorrentes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {info.temas_recorrentes.map((t: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-lavender-200/30 text-lavender-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-lavender-600">
                  Serão identificados pela IA conforme as sessões avançam.
                </p>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-lavender-300/20">
              <div className="text-xs uppercase tracking-wider text-lavender-400 mb-3">
                Plano terapêutico
              </div>
              {info?.plano_terapeutico && info.plano_terapeutico.length > 0 ? (
                <ul className="space-y-1 text-sm text-lavender-800">
                  {info.plano_terapeutico.map((p: string, i: number) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-lavender-600">
                  A definir.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
