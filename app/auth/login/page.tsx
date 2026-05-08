"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Shield, Eye, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro("Erro ao entrar. Tente novamente.");
      }
      setCarregando(false);
      return;
    }

    // Forca reload completo pra atualizar sessao
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="flex items-center gap-2 mb-6 text-sm text-lavender-600"
        >
          <ChevronLeft size={16} />
          <span>Voltar</span>
        </Link>

        <div className="bg-white/80 rounded-3xl p-8 shadow-2xl border border-lavender-300/30">
          <div className="text-center mb-6">
            <div className="flex justify-center">
              <Logo size="md" />
            </div>
            <h2 className="text-2xl mt-3 font-serif text-lavender-800">
              Bem-vinda de volta
            </h2>
            <p className="text-sm mt-1 text-lavender-600">
              Acesse sua conta Sintonia
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full py-3 rounded-xl font-medium text-cream disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7a5d8e 0%, #5d4470 100%)",
              }}
            >
              {carregando ? "Conectando..." : "Entrar"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/auth/cadastro"
              className="text-sm text-lavender-600 hover:underline"
            >
              Nao tem conta? Criar uma
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-xs flex items-center justify-center gap-4 text-lavender-600">
          <span className="flex items-center gap-1">
            <Lock size={11} />
            <span>Seguro</span>
          </span>
          <span className="flex items-center gap-1">
            <Shield size={11} />
            <span>Etico</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} />
            <span>Sigiloso</span>
          </span>
        </div>
      </div>
    </div>
  );
}
