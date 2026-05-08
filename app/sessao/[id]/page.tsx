import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessaoVivo from "@/components/SessaoVivo";

export const dynamic = "force-dynamic";

export default async function SessaoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string; room?: string };
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

  const { data: sessao } = await supabase
    .from("sessoes")
    .select("*, paciente:profiles!sessoes_paciente_id_fkey(nome_completo)")
    .eq("id", params.id)
    .eq("psicologa_id", user.id)
    .maybeSingle();

  if (!sessao) notFound();

  const roomUrl = searchParams.room
    ? "https://" + process.env.DAILY_DOMAIN + ".daily.co/" + searchParams.room
    : null;

  return (
    <SessaoVivo
      sessaoId={sessao.id}
      pacienteNome={(sessao as any).paciente?.nome_completo || "Paciente"}
      roomUrl={roomUrl}
      roomName={searchParams.room || ""}
      token={searchParams.token || ""}
    />
  );
}
