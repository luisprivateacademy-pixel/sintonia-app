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

    const { sessao_id } = await request.json();

    const { data: sessao } = await supabase
      .from("sessoes")
      .select("*")
      .eq("id", sessao_id)
      .eq("paciente_id", user.id)
      .eq("status", "em_andamento")
      .maybeSingle();

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessao nao encontrada ou ja encerrada" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nome_completo")
      .eq("id", user.id)
      .maybeSingle();

    const dailyApiKey = process.env.DAILY_API_KEY;

    const listResp = await fetch("https://api.daily.co/v1/rooms?limit=20", {
      headers: { Authorization: "Bearer " + dailyApiKey },
    });
    const listData = await listResp.json();
    const rooms = listData.data || [];

    const sala = rooms
      .filter((r: any) => r.name.startsWith("sintonia-"))
      .sort((a: any, b: any) =>
        b.created_at.localeCompare(a.created_at)
      )[0];

    if (!sala) {
      return NextResponse.json(
        { error: "Sala nao encontrada" },
        { status: 404 }
      );
    }

    const tokenResp = await fetch(
      "https://api.daily.co/v1/meeting-tokens",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + dailyApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: sala.name,
            user_name: profile?.nome_completo || "Paciente",
            is_owner: false,
            exp: Math.floor(Date.now() / 1000) + 7200,
          },
        }),
      }
    );

    const { token } = await tokenResp.json();

    return NextResponse.json({
      room_name: sala.name,
      token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro" },
      { status: 500 }
    );
  }
}
