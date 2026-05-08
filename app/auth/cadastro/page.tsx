"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Stethoscope, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import type { UserRole } from "@/types/database";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tipo, setTipo] = useState<UserRole | null>(null);
  const [nome, setNome] = useState("");
  const [crp, setCrp] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo || !aceiteLgpd) return;
    setErro("");
    setCarregando(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_completo: nome,
          role: tipo,
          aceite_lgpd: true,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setErro(
        signUpError.message.includes("already registered")
          ? "Este e-mail já está cadastrado. Tente entrar."
          : "Erro ao cadastrar: " + signUpError.message
      );
      setCarregando(false);
      return;
    }

    if (tipo === "psicologa" && crp) {
      // Atualiza CRP após cadastro - só funciona se confirmação de email estiver desabilitada
      // Se estiver ativada, o usuário precisará atualizar depois pelo perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ crp }).eq("id", user.id);
      }
    }

    setSucesso(true);
    setCarregando(false);
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-lavender-300/30 text-center">
          <Logo size="lg" />
          <h2 className="text-2xl mt-4 font-serif text-lavender-800">
            Verifique seu e-mail
          </h2>
          <p className="text-sm mt-3 text-lavender-600 leading-relaxed">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 text-sm text-lavender-700 underline"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    );
  }

  if (!tipo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Link href="/auth/login" className="flex items-center gap-2 mb-6 text-sm text-lavender-600">
            <ChevronLeft size={16} /> Voltar
          </Link>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-serif text-lavender-800">
              Criar conta
            </h1>
            <p className="text-sm mt-2 text-lavender-600">
              Como você vai usar o Sintonia?
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setTipo("psicologa")}
              className="w-full p-6 rounded-2xl text-left bg-white/70 backdrop-blur-md border border-lavender-300/30 hover:scale-[1.02] hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-lavender-200/40">
                  <Stethoscope size={24} className="text-lavender-700" />
                </div>
                <div className="flex-1">
                  <div className="font-serif text-xl text-lavender-800">
                    Sou psicóloga
                  </div>
                  <div className="text-xs mt-0.5 text-lavender-600">
                    Quero acompanhar meus pacientes
                  </div>
                </div>
                <ChevronRight size={20} className="text-lavender-400" />
              </div>
            </button>

            <button
              onClick={() => setTipo("paciente")}
              className="w-full p-6 rounded-2xl text-left bg-white/70 backdrop-blur-md border border-lavender-300/30 hover:scale-[1.02] hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-lavender-200/40">
                  <Heart size={24} className="text-lavender-700" />
                </div>
                <div className="flex-1">
                  <div className="font-serif text-xl text-lavender-800">
                    Sou paciente
                  </div>
                  <div className="text-xs mt-0.5 text-lavender-600">
                    Quero fazer terapia
                  </div>
                </div>
                <ChevronRight size={20} className="text-lavender-400" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <button
          onClick={() => setTipo(null)}
          className="flex items-center gap-2 mb-6 text-sm text-lavender-600"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-lavender-300/30">
          <div className="text-center mb-6">
            <Logo size="md" />
            <h2 className="text-2xl mt-3 font-serif text-lavender-800">
              {tipo === "psicologa" ? "Cadastro profissional" : "Crie sua conta"}
            </h2>
          </div>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-lavender-600">
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 rounded-xl bg-white/60 border border-lavender-300/50 text-lavender-800"
              />
            </div>

            {tipo === "psicologa" && (
              <div>
                <label className="text-xs uppercase tracking-wider text-lavender-600">
                  CRP
                </label>
                <input
                  type="text"
                  value={crp}
                  onChange={(e) => setCrp(e.target.value)}
                  required
                  placeholder="05/77338"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/60 border border-lavender-300/50 text-lavender-800"
                />
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-wider text-lavender-600">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 rounded-xl bg-white/60 border border-lavender-300/50 text-lavender-800"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-lavender-600">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full mt-1 px-4 py-3 rounded-xl bg-white/60 border border-lavender-300/50 text-lavender-800"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-lavender-200/20">
              <input
                type="checkbox"
                checked={aceiteLgpd}
                onChange={(e) => setAceiteLgpd(e.target.checked)}
                className="mt-1"
              />
              <span className="text-xs leading-relaxed text-lavender-700">
                Li e concordo com a Política de Privacidade, Termos de Uso e
                Termo de Consentimento LGPD para tratamento de dados sensíveis
                de saúde mental.
              </span>
            </label>

            {erro && (
              <div className="text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !aceiteLgpd}
              className="w-full py-3.5 rounded-xl font-medium tracking-wide transition-all disabled:opacity-50 hover:shadow-lg text-cream"
              style={{
                background: "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
              }}
            >
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <div className="text-center mt-4 text-xs text-lavender-600 flex items-center justify-center gap-1.5">
            <Shield size={11} /> Seus dados são protegidos pela LGPD
          </div>
        </div>
      </div>
    </div>
  );
}
