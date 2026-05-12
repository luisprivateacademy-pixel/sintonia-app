import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300; // 5 minutos de timeout pra processar audio longo

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

    if (!audio || !sessao_id) {
      return NextResponse.json(
        { error: "audio e sessao_id sao obrigatorios" },
        { status: 400 }
      );
    }

    // Confirma que a sessao eh da psicologa
    const { data: sessao } = await supabase
      .from("sessoes")
      .select("id, psicologa_id, paciente_id")
      .eq("id", sessao_id)
      .eq("psicologa_id", user.id)
      .maybeSingle();

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessao nao encontrada" },
        { status: 404 }
      );
    }

    const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
    if (!assemblyKey) {
      return NextResponse.json(
        { error: "AssemblyAI nao configurada" },
        { status: 500 }
      );
    }

    // ETAPA 1: Upload do audio pro AssemblyAI
    const audioBuffer = await audio.arrayBuffer();

    const uploadResp = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        Authorization: assemblyKey,
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer,
    });

    if (!uploadResp.ok) {
      const erro = await uploadResp.text();
      console.error("Erro upload AssemblyAI:", erro);
      return NextResponse.json(
        { error: "Erro ao enviar audio" },
        { status: 500 }
      );
    }

    const { upload_url } = await uploadResp.json();

    // ETAPA 2: Solicita transcricao com diarizacao
    const transcribeResp = await fetch(
      "https://api.assemblyai.com/v2/transcript",
      {
        method: "POST",
        headers: {
          Authorization: assemblyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: "pt",
          speaker_labels: true,
          speakers_expected: 2,
          punctuate: true,
          format_text: true,
        }),
      }
    );

    if (!transcribeResp.ok) {
      const erro = await transcribeResp.text();
      console.error("Erro transcribe AssemblyAI:", erro);
      return NextResponse.json(
        { error: "Erro ao solicitar transcricao" },
        { status: 500 }
      );
    }

    const { id: transcriptId } = await transcribeResp.json();

    // ETAPA 3: Polling pra esperar transcricao completar
    let transcriptData: any = null;
    const maxTentativas = 60; // 60 tentativas x 5 seg = 5 min max
    let tentativa = 0;

    while (tentativa < maxTentativas) {
      await new Promise((r) => setTimeout(r, 5000)); // espera 5 seg

      const statusResp = await fetch(
        "https://api.assemblyai.com/v2/transcript/" + transcriptId,
        {
          headers: { Authorization: assemblyKey },
        }
      );

      transcriptData = await statusResp.json();

      if (transcriptData.status === "completed") break;
      if (transcriptData.status === "error") {
        console.error("Erro AssemblyAI:", transcriptData.error);
        return NextResponse.json(
          { error: "Erro na transcricao: " + transcriptData.error },
          { status: 500 }
        );
      }

      tentativa++;
    }

    if (!transcriptData || transcriptData.status !== "completed") {
      return NextResponse.json(
        { error: "Timeout na transcricao" },
        { status: 500 }
      );
    }

    // ETAPA 4: Apaga transcricoes antigas (do Groq) e salva as novas com diarizacao
    await supabase
      .from("transcricoes")
      .delete()
      .eq("sessao_id", sessao_id);

    // Mapeia speaker A/B pra psicologa/paciente
    // Por convencao: speaker que fala primeiro eh a psicologa
    let primeiroSpeaker: string | null = null;

    if (transcriptData.utterances && transcriptData.utterances.length > 0) {
      const novasTranscricoes = transcriptData.utterances.map((u: any) => {
        if (primeiroSpeaker === null) {
          primeiroSpeaker = u.speaker;
        }
        const falante =
          u.speaker === primeiroSpeaker ? "psicologa" : "paciente";
        return {
          sessao_id,
          conteudo: u.text,
          falante,
          timestamp_segundos: Math.floor(u.start / 1000),
        };
      });

      await supabase.from("transcricoes").insert(novasTranscricoes);
    } else if (transcriptData.text) {
      // Fallback: sem diarizacao, salva texto unico
      await supabase.from("transcricoes").insert({
        sessao_id,
        conteudo: transcriptData.text,
        falante: "paciente",
        timestamp_segundos: 0,
      });
    }

    return NextResponse.json({
      ok: true,
      texto_completo: transcriptData.text,
      utterances: transcriptData.utterances?.length || 0,
    });
  } catch (err: any) {
    console.error("Erro transcrever-final:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
