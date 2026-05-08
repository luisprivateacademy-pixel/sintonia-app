import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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
            </div>
          </div>
        </header>

        <div className="bg-white/80 rounded-2xl p-6 border border-lavender-300/20">
          <h3 className="font-serif text-xl text-lavender-800 mb-3">
            Sobre este paciente
          </h3>
          <p className="text-sm italic text-lavender-600">
            Anamnese, sessoes e historico clinico estarao disponiveis na Parte 2
            do projeto, junto com a videochamada e a IA assistente.
          </p>
        </div>
      </div>
    </div>
  );
}
