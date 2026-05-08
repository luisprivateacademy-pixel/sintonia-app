import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const { sessao_id, notas } = await request.json();

    const { data: resumoExistente } = await supabase
      .from("resumos_ia")
      .select("id")
      .eq("sessao_id", sessao_id)
      .maybeSingle();

    if (resumoExistente) {
      await supabase
        .from("resumos_ia")
        .update({ notas_psicologa: notas })
        .eq("sessao_id", sessao_id);
    } else {
      await supabase.from("resumos_ia").insert({
        sessao_id,
        notas_psicologa: notas,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro" },
      { status: 500 }
    );
  }
}
