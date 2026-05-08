import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessaoPaciente from "@/components/SessaoPaciente";

export const dynamic = "force-dynamic";

export default async function SessaoPacientePage({
  searchParams,
}: {
  searchParams: { token?: string; room?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const roomUrl = searchParams.room
    ? "https://" + process.env.DAILY_DOMAIN + ".daily.co/" + searchParams.room
    : null;

  if (!roomUrl || !searchParams.token) redirect("/paciente");

  return <SessaoPaciente roomUrl={roomUrl} token={searchParams.token} />;
}
