"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";

export default function EntrarSessaoButton({
  sessaoId,
}: {
  sessaoId: string;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [aceito, setAceito] = useState(false);

  async function entrar() {
    if (!aceito) return;
    setCarregando(true);
    try {
      const resp = await fetch("/api/sessoes/entrar-paciente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessao_id: sessaoId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert("Erro: " + (data.error || "tente novamente"));
        setCarregando(false);
        return;
      }
      router.push(
        "/sessao-paciente?room=" + data.room_name + "&token=" + data.token
      );
    } catch (err: any) {
      alert("Erro: " + err.message);
      setCarregando(false);
    }
  }

  return (
    <div>
      <div className="bg-purple-100 rounded-xl p-4 mb-4 border border-purple-300">
        <div className="text-xs uppercase tracking-wider text-purple-700 mb-2">
          Sessao em andamento
        </div>
        <p className="text-sm text-purple-800">
          Sua psicologa esta esperando voce na sala virtual.
        </p>
      </div>

      <label className="flex items-start gap-3 p-3 rounded-xl bg-lavender-200/20 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={aceito}
          onChange={(e) => setAceito(e.target.checked)}
          className="mt-1"
        />
        <span className="text-xs leading-relaxed text-lavender-700">
          Estou ciente de que esta sessao sera gravada e transcrita com auxilio
          de IA, conforme termo de consentimento previamente assinado.
          Informacoes sao confidenciais e protegidas pela LGPD.
        </span>
      </label>

      <button
        onClick={entrar}
        disabled={!aceito || carregando}
        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-cream disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
        }}
      >
        <Video size={18} />
        <span className="font-serif text-lg">
          {carregando ? "Conectando..." : "Entrar na sessao"}
        </span>
      </button>
    </div>
  );
}
