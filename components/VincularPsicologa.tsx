"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VincularPsicologa({
  pacienteId,
}: {
  pacienteId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [emailPsicologa, setEmailPsicologa] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleVincular(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { data: psicologa, error: erroBusca } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", emailPsicologa.trim().toLowerCase())
      .eq("role", "psicologa")
      .single();

    if (erroBusca || !psicologa) {
      setErro(
        "Não encontramos uma psicóloga cadastrada com esse e-mail. Confira com ela."
      );
      setCarregando(false);
      return;
    }

    const { error: erroUpdate } = await supabase
      .from("profiles")
      .update({ psicologa_id: psicologa.id })
      .eq("id", pacienteId);

    if (erroUpdate) {
      setErro("Erro ao vincular: " + erroUpdate.message);
      setCarregando(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6 border border-lavender-300/30">
      <h2 className="font-serif text-2xl text-lavender-800 mb-2">
        Vincule-se à sua psicóloga
      </h2>
      <p className="text-sm text-lavender-600 mb-6">
        Digite o e-mail da sua psicóloga cadastrada no Sintonia.
      </p>

      <form onSubmit={handleVincular} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-lavender-600">
            E-mail da psicóloga
          </label>
          <input
            type="email"
            value={emailPsicologa}
            onChange={(e) => setEmailPsicologa(e.target.value)}
            required
            placeholder="psicologa@email.com"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-white/60 border border-lavender-300/50 text-lavender-800"
          />
        </div>

        {erro && (
          <div className="text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 rounded-xl text-cream"
          style={{
            background:
              "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
          }}
        >
          {carregando ? "Vinculando..." : "Vincular"}
        </button>
      </form>
    </div>
  );
}
