"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

interface Trecho {
  id: string;
  conteudo: string;
  falante: string | null;
  timestamp_segundos: number | null;
}

interface Props {
  trechos: Trecho[];
}

export default function TranscricaoCompleta({ trechos }: Props) {
  const [aberto, setAberto] = useState(false);

  function formatarTimestamp(segundos: number | null) {
    if (segundos === null || segundos === undefined) return "";
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return min + ":" + String(seg).padStart(2, "0");
  }

  function rotuloFalante(falante: string | null) {
    if (falante === "psicologa") return "Psicologa";
    if (falante === "paciente") return "Paciente";
    return "Fala";
  }

  function corFalante(falante: string | null) {
    if (falante === "psicologa") return "#5d4470";
    return "#a78bca";
  }

  return (
    <div className="rounded-xl border border-lavender-300/30 bg-white/40">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/30 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-lavender-600" />
          <span className="text-xs uppercase tracking-wider text-lavender-700">
            Transcricao completa
          </span>
          <span className="text-[10px] text-lavender-500">
            ({trechos.length} {trechos.length === 1 ? "trecho" : "trechos"})
          </span>
        </div>
        {aberto ? (
          <ChevronUp size={16} className="text-lavender-600" />
        ) : (
          <ChevronDown size={16} className="text-lavender-600" />
        )}
      </button>

      {aberto && (
        <div className="px-4 pb-4 pt-2 max-h-96 overflow-y-auto space-y-3">
          {trechos.map((t, i) => (
            <div key={t.id || i} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] uppercase tracking-wider font-medium"
                  style={{ color: corFalante(t.falante) }}
                >
                  {rotuloFalante(t.falante)}
                </span>
                {t.timestamp_segundos !== null &&
                  t.timestamp_segundos !== undefined && (
                    <span className="text-[10px] text-lavender-400">
                      {formatarTimestamp(t.timestamp_segundos)}
                    </span>
                  )}
              </div>
              <div className="text-lavender-900 leading-relaxed pl-1">
                {t.conteudo}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
