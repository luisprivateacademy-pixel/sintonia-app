import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

export default async function PacientesPage() {
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

  const { data: pacientes } = await supabase
    .from("profiles")
    .select("*")
    .eq("psicologa_id", user.id)
    .eq("role", "paciente")
    .order("nome_completo");

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
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/40 text-lavender-700"
          >
            Início
          </Link>
          <Link
            href="/pacientes"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm shadow-md text-cream"
            style={{
              background: "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
            }}
          >
            Pacientes
          </Link>
        </nav>

        <div className="space-y-1 pt-4 border-t border-lavender-300/20">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl">
          <header className="mb-8">
            <div className="text-xs uppercase tracking-[0.3em] mb-2 text-lavender-400">
              seu acompanhamento
            </div>
            <h1 className="text-4xl font-serif text-lavender-800">Pacientes</h1>
            <p className="mt-1 text-lavender-600">
              {pacientes?.length ?? 0} pessoas em acompanhamento
            </p>
          </header>

          {!pacientes || pacientes.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-lavender-300/20">
              <h2 className="font-serif text-2xl text-lavender-800 mb-3">
                Nenhum paciente ainda
              </h2>
              <p className="text-sm text-lavender-600 mb-6">
                Compartilhe o link de cadastro com seus pacientes para que eles
                possam criar conta e te selecionar como psicóloga.
              </p>
              <div className="bg-lavender-100/50 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-xs text-lavender-700 mb-2">
                  Link de cadastro:
                </p>
                <code className="text-xs text-lavender-800 break-all">
                  /auth/cadastro
                </code>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {pacientes.map((p) => (
                <Link
                  key={p.id}
                  href={`/pacientes/${p.id}`}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 border border-lavender-300/20"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 font-serif"
                      style={{ background: "#a78bca" }}
                    >
                      {p.nome_completo
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-lg text-lavender-800">
                        {p.nome_completo}
                      </div>
                      <div className="text-xs text-lavender-600">{p.email}</div>
                      <div className="text-xs text-lavender-600 mt-2">
                        Cadastrado em{" "}
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-lavender-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
