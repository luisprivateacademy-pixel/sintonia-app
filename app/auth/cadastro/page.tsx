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

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo || !aceiteLgpd) return;
    setErro("");
    setCarregando(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_completo: nome,
          role: tipo,
          aceite_lgpd: true,
          crp: tipo === "psicologa" ? crp : null,
        },
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

    // Se já tem sessão (confirm email desativado), atualiza CRP e redireciona
    if (data.session) {
      if (tipo === "psicologa" && crp) {
        await supabase.from("profiles").update({ crp }).eq("id", data.user!.id);
      }
      router.push("/");
      router.refresh();
      return;
    }

    // Se não tem sessão (confirm email ativado), avisa pra confirmar
    setErro(
      "Conta criada. Verifique seu e-mail para confirmar e fazer login."
    );
    setCarregando(false);
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
                <ChevronRight size={20} className="text-lave
