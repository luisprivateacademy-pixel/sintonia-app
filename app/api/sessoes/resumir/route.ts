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

    const { sessao_id } = await request.json();

    if (!sessao_id) {
      return NextResponse.json(
        { error: "sessao_id eh obrigatorio" },
        { status: 400 }
      );
    }

    // Confirma que a sessao eh dele
    const { data: sessao } = await supabase
      .from("sessoes")
      .select("id, paciente_id")
      .eq("id", sessao_id)
      .eq("psicologa_id", user.id)
      .maybeSingle();

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessao nao encontrada" },
        { status: 404 }
      );
    }

    // Pega todas as transcricoes da sessao
    const { data: transcricoes } = await supabase
      .from("transcricoes")
      .select("conteudo")
      .eq("sessao_id", sessao_id)
      .order("timestamp_segundos", { ascending: true });

    if (!transcricoes || transcricoes.length === 0) {
      return NextResponse.json({
        resumo: null,
        mensagem: "Sem transcricoes ainda",
      });
    }

    const textoCompleto = transcricoes.map((t) => t.conteudo).join(" ");

    // Pega contexto do paciente
    const { data: paciente } = await supabase
      .from("profiles")
      .select("nome_completo")
      .eq("id", sessao.paciente_id)
      .maybeSingle();

    // Chama Claude API
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "Anthropic nao configurada" },
        { status: 500 }
      );
    }

    const prompt = `Voce eh uma IA assistente de uma psicologa durante uma sessao de terapia. Analise a transcricao abaixo e gere um resumo clinico estruturado.

Paciente: ${paciente?.nome_completo || "Paciente"}

Transcricao da sessao ate o momento:
"""
${textoCompleto}
"""

Gere um JSON com a seguinte estrutura, sem markdown, sem texto adicional:
{
  "tema_principal": "string com o tema central da sessao em uma frase curta",
  "pontos_principais": ["array de 3-5 pontos chave abordados, cada um como string curta"],
  "insights": [
    {"tipo": "padrao", "texto": "padrao identificado", "confianca": 85},
    {"tipo": "tema", "texto": "tema recorrente", "confianca": 90},
    {"tipo": "alerta", "texto": "ponto de atencao", "confianca": 75}
  ],
  "sugestoes_proxima_sessao": "sugestao de abordagem para proxima sessao em 1-2 frases"
}

Tipos de insight permitidos: "padrao", "tema", "sugestao", "alerta".
Confianca de 0 a 100.
Maximo 4 insights.
Use linguagem clinica respeitosa.`;

    const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeResp.ok) {
      const erro = await claudeResp.text();
      console.error("Erro Claude:", erro);
      return NextResponse.json(
        { error: "Erro ao gerar resumo" },
        { status: 500 }
      );
    }

    const claudeData = await claudeResp.json();
    const respostaTexto = claudeData.content[0].text;

    let resumoJson;
    try {
      resumoJson = JSON.parse(respostaTexto);
    } catch (e) {
      console.error("Erro parse JSON:", respostaTexto);
      return NextResponse.json(
        { error: "Resposta invalida da IA" },
        { status: 500 }
      );
    }

    // Salva ou atualiza resumo
    const { data: resumoExistente } = await supabase
      .from("resumos_ia")
      .select("id")
      .eq("sessao_id", sessao_id)
      .maybeSingle();

    if (resumoExistente) {
      await supabase
        .from("resumos_ia")
        .update({
          tema_principal: resumoJson.tema_principal,
          pontos_principais: resumoJson.pontos_principais,
          insights: resumoJson.insights,
          sugestoes_proxima_sessao: resumoJson.sugestoes_proxima_sessao,
        })
        .eq("sessao_id", sessao_id);
    } else {
      await supabase.from("resumos_ia").insert({
        sessao_id,
        tema_principal: resumoJson.tema_principal,
        pontos_principais: resumoJson.pontos_principais,
        insights: resumoJson.insights,
        sugestoes_proxima_sessao: resumoJson.sugestoes_proxima_sessao,
      });
    }

    return NextResponse.json({
      resumo: resumoJson,
    });
  } catch (err: any) {
    console.error("Erro resumir:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
