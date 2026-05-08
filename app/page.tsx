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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const role = user.user_metadata?.role;
    if (role === "psicologa") {
      redirect("/dashboard");
    }
    redirect("/paciente");
  }

  if (profile.role === "psicologa") {
    redirect("/dashboard");
  }
  redirect("/paciente");
}
