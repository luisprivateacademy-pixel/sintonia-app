import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

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
    .maybeSingle();

  if (!profile) redirect("/");
  if (profile.role !== "psicologa") redirect("/paciente");

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
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-white/40 text-lavender-700"
          >
            Inicio
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
            <h1 className="text-4xl font-serif text-lavender-800">Pacientes</h1>
            <p className="mt-1 text-lavender-600">
              {pacientes?.length ?? 0} pessoas em acompanhamento
            </p>
          </header>

          {!pacientes || pacientes.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-12 text-center border border-lavender-300/20">
              <h2 className="font-serif text-2xl text-lavender-800 mb-3">
                Nenhum paciente ainda
              </h2>
              <p className="text-sm text-lavender-600 mb-2">
                Compartilhe o link de cadastro com seus pacientes.
              </p>
              <p className="text-xs text-lavender-500">
                Eles podem se cadastrar como paciente e te selecionar pelo
                e-mail.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {pacientes.map((p) => (
                <Link
                  key={p.id}
                  href={"/pacientes/" + p.id}
                  className="bg-white/80 rounded-2xl p-5 hover:shadow-lg transition-all border border-lavender-300/20"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-serif"
                      style={{ background: "#a78bca" }}
                    >
                      {p.nome_completo[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-lg text-lavender-800">
                        {p.nome_completo}
                      </div>
                      <div className="text-xs text-lavender-600">
                        {p.email}
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
