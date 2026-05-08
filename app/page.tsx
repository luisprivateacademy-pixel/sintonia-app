import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Tenta buscar o profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Se nao existe, cria agora (fallback caso o trigger falhe)
  if (!profile) {
    const meta = user.user_metadata || {};
    const role = meta.role === "psicologa" ? "psicologa" : "paciente";
    const nomeCompleto =
      meta.nome_completo || user.email?.split("@")[0] || "Usuario";

    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      nome_completo: nomeCompleto,
      role: role,
      aceite_lgpd: meta.aceite_lgpd === true,
      aceite_lgpd_em: meta.aceite_lgpd === true ? new Date().toISOString() : null,
    });

    profile = { role };
  }

  if (profile.role === "psicologa") {
    redirect("/dashboard");
  }
  redirect("/paciente");
}
