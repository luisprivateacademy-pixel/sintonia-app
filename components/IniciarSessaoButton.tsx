"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";

export default function IniciarSessaoButton({
  pacienteId,
}: {
  pacienteId: string;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function iniciar() {
    if (carregando) return;
    if (!confirm("Iniciar sessao com este paciente agora?")) return;

    setCarregando(true);
    try {
      const resp = await fetch("/api/sessoes/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente_id: pacienteId }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert("Erro: " + (data.error || "tente novamente"));
        setCarregando(false);
        return;
      }

      // Redireciona pra sala da sessao
      router.push(
        "/sessao/" +
          data.sessao_id +
          "?room=" +
          data.room_name +
          "&token=" +
          data.token_psicologa
      );
    } catch (err: any) {
      alert("Erro: " + err.message);
      setCarregando(false);
    }
  }

  return (
    <button
      onClick={iniciar}
      disabled={carregando}
      className="px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-white disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
      }}
    >
      <Video size={14} />
      {carregando ? "Iniciando..." : "Iniciar sessao"}
    </button>
  );
}
