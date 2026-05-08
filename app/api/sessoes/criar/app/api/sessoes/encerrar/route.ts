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

    const { sessao_id, room_name } = await request.json();

    if (!sessao_id) {
      return NextResponse.json(
        { error: "sessao_id eh obrigatorio" },
        { status: 400 }
      );
    }

    // Atualiza status da sessao
    const { error: erroUpdate } = await supabase
      .from("sessoes")
      .update({
        status: "concluida",
        finalizada_em: new Date().toISOString(),
      })
      .eq("id", sessao_id)
      .eq("psicologa_id", user.id);

    if (erroUpdate) {
      console.error("Erro ao atualizar sessao:", erroUpdate);
    }

    // Deleta sala da Daily (libera recursos)
    if (room_name && process.env.DAILY_API_KEY) {
      try {
        await fetch("https://api.daily.co/v1/rooms/" + room_name, {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + process.env.DAILY_API_KEY,
          },
        });
      } catch (err) {
        console.error("Erro ao deletar sala:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
