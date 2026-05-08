export type UserRole = "psicologa" | "paciente";

export type SessaoStatus =
  | "agendada"
  | "em_andamento"
  | "concluida"
  | "cancelada"
  | "falta";

export interface Profile {
  id: string;
  email: string;
  nome_completo: string;
  role: UserRole;
  crp: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  psicologa_id: string | null;
  aceite_lgpd: boolean;
  aceite_lgpd_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface PacienteInfo {
  id: string;
  paciente_id: string;
  queixa_principal: string | null;
  historia_clinica: string | null;
  medicamentos: string | null;
  observacoes_psicologa: string | null;
  temas_recorrentes: string[] | null;
  plano_terapeutico: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Sessao {
  id: string;
  paciente_id: string;
  psicologa_id: string;
  data_agendada: string;
  duracao_minutos: number;
  status: SessaoStatus;
  iniciada_em: string | null;
  finalizada_em: string | null;
  created_at: string;
  updated_at: string;
}
