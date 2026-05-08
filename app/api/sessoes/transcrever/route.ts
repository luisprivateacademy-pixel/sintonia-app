import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    const sessao_id = formData.get("sessao_id") as string | null;
    const timestamp_segundos = parseInt(
      (formData.get("timestamp_segundos") as string) || "0"
    );

    if (!audio || !sessao_id) {
      return NextResponse.json(
        { error: "audio e sessao_id sao obrigatorios" },
        { status: 400 }
      );
    }

    // Confirma que a sessao eh dele
    const { data: sessao } = await supabase
      .from("sessoes")
      .select("id, psicologa_id")
      .eq("id", sessao_id)
      .eq("psicologa_id", user.id)
      .maybeSingle();

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessao nao encontrada" },
        { status: 404 }
      );
    }

    // Manda audio pro Groq Whisper
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq nao configurada" },
        { status: 500 }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", audio);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", "pt");
    groqForm.append("response_format", "json");

    const groqResp = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + groqApiKey,
        },
        body: groqForm,
      }
    );

    if (!groqResp.ok) {
      const erro = await groqResp.text();
      console.error("Erro Groq:", erro);
      return NextResponse.json(
        { error: "Erro ao transcrever audio" },
        { status: 500 }
      );
    }

    const { text } = await groqResp.json();

    if (!text || text.trim().length < 3) {
      return NextResponse.json({ texto: "", salvo: false });
    }

    // Salva transcricao no banco
    await supabase.from("transcricoes").insert({
      sessao_id,
      conteudo: text,
      falante: "paciente", // Por enquanto generico, a separacao seria mais complexa
      timestamp_segundos,
    });

    return NextResponse.json({
      texto: text,
      salvo: true,
    });
  } catch (err: any) {
    console.error("Erro transcrever:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
