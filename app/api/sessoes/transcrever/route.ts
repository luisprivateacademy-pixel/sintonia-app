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

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq nao configurada" },
        { status: 500 }
      );
    }

    // Pega ultima transcricao pra usar como contexto
    const { data: ultimasTrans } = await supabase
      .from("transcricoes")
      .select("conteudo")
      .eq("sessao_id", sessao_id)
      .order("timestamp_segundos", { ascending: false })
      .limit(1);

    const contextoAnterior =
      ultimasTrans && ultimasTrans.length > 0 ? ultimasTrans[0].conteudo : "";

    // Prompt de contexto pra Whisper - evita alucinacao e melhora qualidade
    const promptContexto =
      "Sessao de psicoterapia em portugues brasileiro entre psicologa e paciente. Conversa profissional e respeitosa sobre saude mental, emocoes, comportamentos e historia pessoal. " +
      (contextoAnterior ? "Contexto anterior: " + contextoAnterior : "");

    const groqForm = new FormData();
    groqForm.append("file", audio);
    // Modelo de qualidade superior (nao-turbo)
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", "pt");
    groqForm.append("response_format", "json");
    groqForm.append("temperature", "0");
    groqForm.append("prompt", promptContexto.substring(0, 224));

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

    // Filtra alucinacoes comuns do Whisper em silencio
    const alucinacoesComuns = [
      "obrigado",
      "obrigada",
      "muito obrigado",
      "muito obrigada",
      "valeu",
      "tchau",
      "ate logo",
      "bom dia",
      "boa tarde",
      "boa noite",
      "ola pessoal",
      "ola",
      "e ai",
      "...",
    ];

    const textoLower = text.trim().toLowerCase().replace(/\./g, "").trim();
    const ehAlucinacao = alucinacoesComuns.some(
      (a) => textoLower === a || textoLower === a + "."
    );

    if (ehAlucinacao) {
      return NextResponse.json({ texto: "", salvo: false });
    }

    await supabase.from("transcricoes").insert({
      sessao_id,
      conteudo: text,
      falante: "paciente",
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
