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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, nome_completo")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "psicologa") {
      return NextResponse.json(
        { error: "Apenas psicologas podem criar sessoes" },
        { status: 403 }
      );
    }

    const { paciente_id } = await request.json();

    if (!paciente_id) {
      return NextResponse.json(
        { error: "paciente_id eh obrigatorio" },
        { status: 400 }
      );
    }

    const { data: paciente } = await supabase
      .from("profiles")
      .select("id, nome_completo")
      .eq("id", paciente_id)
      .eq("psicologa_id", user.id)
      .maybeSingle();

    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente nao encontrado" },
        { status: 404 }
      );
    }

    const dailyDomain = process.env.DAILY_DOMAIN;
    const dailyApiKey = process.env.DAILY_API_KEY;

    if (!dailyDomain || !dailyApiKey) {
      return NextResponse.json(
        { error: "Daily nao configurada" },
        { status: 500 }
      );
    }

    const roomName =
      "sintonia-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8);

    const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + dailyApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          enable_recording: false,
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 7200,
        },
      }),
    });

    if (!dailyResponse.ok) {
      const erro = await dailyResponse.text();
      console.error("Erro Daily:", erro);
      return NextResponse.json(
        { error: "Erro ao criar sala de video" },
        { status: 500 }
      );
    }

    const sala = await dailyResponse.json();

    const { data: sessao, error: erroSessao } = await supabase
      .from("sessoes")
      .insert({
        paciente_id,
        psicologa_id: user.id,
        data_agendada: new Date().toISOString(),
        status: "em_andamento",
        iniciada_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (erroSessao) {
      console.error("Erro ao criar sessao:", erroSessao);
      return NextResponse.json(
        { error: "Erro ao registrar sessao" },
        { status: 500 }
      );
    }

    const tokenPsicologaResp = await fetch(
      "https://api.daily.co/v1/meeting-tokens",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + dailyApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: profile.nome_completo,
            is_owner: true,
            exp: Math.floor(Date.now() / 1000) + 7200,
          },
        }),
      }
    );

    const { token: tokenPsicologa } = await tokenPsicologaResp.json();

    const tokenPacienteResp = await fetch(
      "https://api.daily.co/v1/meeting-tokens",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + dailyApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: paciente.nome_completo,
            is_owner: false,
            exp: Math.floor(Date.now() / 1000) + 7200,
          },
        }),
      }
    );

    const { token: tokenPaciente } = await tokenPacienteResp.json();

    return NextResponse.json({
      sessao_id: sessao.id,
      room_url: sala.url,
      room_name: roomName,
      token_psicologa: tokenPsicologa,
      token_paciente: tokenPaciente,
    });
  } catch (err: any) {
    console.error("Erro:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
