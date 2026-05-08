"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Sparkles,
  FileText,
  Edit3,
  ChevronLeft,
  Save,
  CheckCircle2,
  Brain,
} from "lucide-react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

interface Props {
  sessaoId: string;
  pacienteNome: string;
  roomUrl: string | null;
  roomName: string;
  token: string;
}

interface Resumo {
  tema_principal: string;
  pontos_principais: string[];
  insights: Array<{ tipo: string; texto: string; confianca: number }>;
  sugestoes_proxima_sessao: string;
}

export default function SessaoVivo({
  sessaoId,
  pacienteNome,
  roomUrl,
  roomName,
  token,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const localMicStreamRef = useRef<MediaStream | null>(null);
  const remoteSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(
    new Map()
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcricoesRef = useRef<string[]>([]);
  const carregandoResumoRef = useRef<boolean>(false);
  const tempoRef = useRef<number>(0);

  const [conectado, setConectado] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [aba, setAba] = useState<"resumo" | "transcricao" | "notas">("resumo");
  const [microAtivo, setMicroAtivo] = useState(true);
  const [videoAtivo, setVideoAtivo] = useState(true);
  const [transcricoes, setTranscricoes] = useState<string[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [notas, setNotas] = useState("");
  const [salvandoNotas, setSalvandoNotas] = useState(false);

  useEffect(() => {
    transcricoesRef.current = transcricoes;
  }, [transcricoes]);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    if (!roomUrl || !token) return;

    const call = DailyIframe.createFrame(videoRef.current!, {
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "0",
        borderRadius: "24px",
      },
      showLeaveButton: false,
      showFullscreenButton: true,
    });

    callRef.current = call;

    call.on("joined-meeting", async () => {
      setConectado(true);
      await iniciarMixagemAudio();
      iniciarGravacao();
    });

    call.on("left-meeting", () => {
      setConectado(false);
      pararTudo();
    });

    call.on("track-started", (event: any) => {
      if (event.track.kind !== "audio") return;
      if (event.participant?.local) return;
      conectarAudioRemoto(event.participant.session_id, event.track);
    });

    call.on("track-stopped", (event: any) => {
      if (event.track.kind !== "audio") return;
      desconectarAudioRemoto(event.participant?.session_id);
    });

    call.join({ url: roomUrl, token });

    return () => {
      pararTudo();
      call.destroy();
    };
  }, [roomUrl, token]);

  useEffect(() => {
    if (!conectado) return;
    const t = setInterval(() => setTempo((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [conectado]);

  useEffect(() => {
    if (!conectado) return;
    const interval = setInterval(() => {
      if (transcricoesRef.current.length > 0 && !carregandoResumoRef.current) {
        gerarResumo();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [conectado]);

  async function iniciarMixagemAudio() {
    try {
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const destination = audioCtx.createMediaStreamDestination();
      destinationRef.current = destination;

      // Microfone local com filtros de qualidade ativados
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      localMicStreamRef.current = localStream;

      const localSource = audioCtx.createMediaStreamSource(localStream);

      // Aplica ganho leve no microfone local pra equalizar volumes
      const localGain = audioCtx.createGain();
      localGain.gain.value = 0.8;
      localSource.connect(localGain);
      localGain.connect(destination);
    } catch (err) {
      console.error("Erro ao iniciar mixagem:", err);
    }
  }

  function conectarAudioRemoto(sessionId: string, track: MediaStreamTrack) {
    const audioCtx = audioContextRef.current;
    const destination = destinationRef.current;
    if (!audioCtx || !destination) return;

    try {
      const stream = new MediaStream([track]);
      const source = audioCtx.createMediaStreamSource(stream);

      // Ganho no audio remoto pra ficar parelho com o local
      const remoteGain = audioCtx.createGain();
      remoteGain.gain.value = 1.0;
      source.connect(remoteGain);
      remoteGain.connect(destination);

      remoteSourcesRef.current.set(sessionId, source);
    } catch (err) {
      console.error("Erro ao conectar audio remoto:", err);
    }
  }

  function desconectarAudioRemoto(sessionId: string | undefined) {
    if (!sessionId) return;
    const source = remoteSourcesRef.current.get(sessionId);
    if (source) {
      try {
        source.disconnect();
      } catch (e) {}
      remoteSourcesRef.current.delete(sessionId);
    }
  }

  function iniciarGravacao() {
    const destination = destinationRef.current;
    if (!destination) {
      console.error("Destination nao iniciada");
      return;
    }
    gravarChunk(destination.stream);
  }

  function gravarChunk(stream: MediaStream) {
    if (!stream.active) return;

    let recorder: MediaRecorder;
    try {
      // Bitrate maior pra qualidade superior
      recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 128000,
      });
    } catch (err) {
      console.error("Erro ao criar MediaRecorder:", err);
      return;
    }

    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      if (blob.size > 1000) {
        await enviarAudio(blob);
      }
      if (stream.active && audioContextRef.current) {
        gravarChunk(stream);
      }
    };

    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, 30000);
  }

  function pararTudo() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (localMicStreamRef.current) {
      localMicStreamRef.current.getTracks().forEach((t) => t.stop());
      localMicStreamRef.current = null;
    }

    remoteSourcesRef.current.forEach((source) => {
      try {
        source.disconnect();
      } catch (e) {}
    });
    remoteSourcesRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    destinationRef.current = null;
  }

  async function enviarAudio(blob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");
      formData.append("sessao_id", sessaoId);
      formData.append("timestamp_segundos", tempoRef.current.toString());

      const resp = await fetch("/api/sessoes/transcrever", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (data.texto && data.salvo) {
        setTranscricoes((t) => [...t, data.texto]);
      }
    } catch (err) {
      console.error("Erro ao enviar audio:", err);
    }
  }

  async function gerarResumo() {
    if (carregandoResumoRef.current) return;
    carregandoResumoRef.current = true;
    setCarregandoResumo(true);
    try {
      const resp = await fetch("/api/sessoes/resumir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessao_id: sessaoId }),
      });
      const data = await resp.json();
      if (data.resumo) {
        setResumo(data.resumo);
      }
    } catch (err) {
      console.error("Erro ao gerar resumo:", err);
    }
    carregandoResumoRef.current = false;
    setCarregandoResumo(false);
  }

  async function salvarNotas() {
    setSalvandoNotas(true);
    try {
      await fetch("/api/sessoes/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessao_id: sessaoId, notas }),
      });
    } catch (err) {
      console.error("Erro:", err);
    }
    setSalvandoNotas(false);
  }

  async function encerrar() {
    if (!confirm("Encerrar sessao? O resumo e transcricao ficam salvos."))
      return;

    pararTudo();

    if (transcricoesRef.current.length > 0) {
      await gerarResumo();
    }

    if (notas) {
      await salvarNotas();
    }

    await fetch("/api/sessoes/encerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessao_id: sessaoId, room_name: roomName }),
    });

    if (callRef.current) {
      callRef.current.leave();
    }

    router.push("/dashboard");
  }

  function formatTempo(s: number) {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const seg = String(s % 60).padStart(2, "0");
    return h + ":" + m + ":" + seg;
  }

  function toggleMicrofone() {
    if (callRef.current) {
      const novo = !microAtivo;
      callRef.current.setLocalAudio(novo);
      setMicroAtivo(novo);
    }
  }

  function toggleVideo() {
    if (callRef.current) {
      const novo = !videoAtivo;
      callRef.current.setLocalVideo(novo);
      setVideoAtivo(novo);
    }
  }

  if (!roomUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900 text-white">
        <div className="text-center">
          <p className="mb-4">Sessao nao encontrada ou expirada.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-purple-600 rounded-xl"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "#1a1422" }}>
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-300"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="text-white font-serif text-lg">
              Sessao com {pacienteNome}
            </div>
            <div className="flex items-center gap-3 text-xs text-purple-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {conectado ? "Gravando" : "Conectando..."}
              </span>
              <span>{formatTempo(tempo)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={encerrar}
          className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm bg-red-600 text-white"
        >
          <Phone size={14} /> Encerrar
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-6 gap-4">
          <div
            ref={videoRef}
            className="flex-1 rounded-3xl overflow-hidden bg-purple-900/30"
            style={{ minHeight: "400px" }}
          />

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleMicrofone}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                background: microAtivo ? "rgba(255,255,255,0.1)" : "#c14a4a",
              }}
            >
              {microAtivo ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              onClick={toggleVideo}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                background: videoAtivo ? "rgba(255,255,255,0.1)" : "#c14a4a",
              }}
            >
              {videoAtivo ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>
        </div>

        <aside
          className="w-[420px] flex flex-col bg-white"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex border-b border-purple-200/30">
            {[
              { id: "resumo" as const, label: "Resumo IA", icone: Sparkles },
              {
                id: "transcricao" as const,
                label: "Transcricao",
                icone: FileText,
              },
              { id: "notas" as const, label: "Notas", icone: Edit3 },
            ].map((t) => {
              const Icon = t.icone;
              return (
                <button
                  key={t.id}
                  onClick={() => setAba(t.id)}
                  className="flex-1 px-4 py-3 text-xs flex items-center justify-center gap-1.5"
                  style={{
                    color: aba === t.id ? "#5d4470" : "#a78bca",
                    borderBottom:
                      aba === t.id
                        ? "2px solid #5d4470"
                        : "2px solid transparent",
                  }}
                >
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {aba === "resumo" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <Sparkles
                    size={12}
                    className={carregandoResumo ? "animate-pulse" : ""}
                  />
                  <span className="italic">
                    {carregandoResumo
                      ? "IA processando..."
                      : "IA atualizando a cada minuto"}
                  </span>
                </div>

                {!resumo ? (
                  <div className="text-center py-12">
                    <Sparkles
                      size={32}
                      className="mx-auto text-purple-300 animate-pulse"
                    />
                    <p className="text-sm italic text-purple-500 mt-3">
                      Aguardando os primeiros minutos da sessao para gerar o
                      resumo...
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">
                        Tema principal
                      </div>
                      <div className="text-base font-serif text-purple-900">
                        {resumo.tema_principal}
                      </div>
                    </div>

                    {resumo.pontos_principais &&
                      resumo.pontos_principais.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-2">
                            Pontos da sessao
                          </div>
                          <div className="space-y-2">
                            {resumo.pontos_principais.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm text-purple-900"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="mt-0.5 flex-shrink-0 text-purple-600"
                                />
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {resumo.insights && resumo.insights.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                          <Brain size={11} /> Insights
                        </div>
                        <div className="space-y-2">
                          {resumo.insights.map((ins, i) => (
                            <div
                              key={i}
                              className="rounded-xl p-3"
                              style={{
                                background:
                                  ins.tipo === "alerta"
                                    ? "rgba(193, 74, 74, 0.08)"
                                    : "rgba(167, 139, 202, 0.1)",
                              }}
                            >
                              <div className="text-[9px] uppercase tracking-wider mb-1 text-purple-700">
                                {ins.tipo} - {ins.confianca}% confianca
                              </div>
                              <div className="text-xs text-purple-900">
                                {ins.texto}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumo.sugestoes_proxima_sessao && (
                      <div className="rounded-xl p-4 bg-purple-100">
                        <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5 text-purple-700">
                          <Sparkles size={11} /> Sugestao proxima sessao
                        </div>
                        <div className="text-sm italic text-purple-900">
                          {resumo.sugestoes_proxima_sessao}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {aba === "transcricao" && (
              <div className="space-y-3">
                {transcricoes.length === 0 ? (
                  <div className="text-center py-12 text-sm italic text-purple-500">
                    A transcricao aparecera aqui em tempo real...
                  </div>
                ) : (
                  transcricoes.map((t, i) => (
                    <div
                      key={i}
                      className="text-sm text-purple-900 leading-relaxed"
                    >
                      {t}
                    </div>
                  ))
                )}
              </div>
            )}

            {aba === "notas" && (
              <div>
                <div className="text-xs mb-3 text-purple-600">
                  Suas anotacoes privadas
                </div>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Digite suas observacoes..."
                  className="w-full h-96 p-4 rounded-xl resize-none outline-none text-sm bg-purple-50 text-purple-900"
                />
                <button
                  onClick={salvarNotas}
                  disabled={salvandoNotas}
                  className="mt-3 px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 bg-purple-200 text-purple-700 disabled:opacity-50"
                >
                  <Save size={12} />
                  {salvandoNotas ? "Salvando..." : "Salvar no prontuario"}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
