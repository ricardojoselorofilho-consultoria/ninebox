import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configurado = Boolean(url && key);

export const supabase = configurado
  ? createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true } })
  : null;

/** Traduz mensagens comuns do Supabase para o português */
export function traduzErro(err) {
  const msg = (err && (err.message || err.error_description || String(err))) || "Erro desconhecido.";
  if (/Database error saving new user|não autorizado/i.test(msg))
    return "Este e-mail não está autorizado. Peça ao RH para cadastrá-lo na tela Usuários.";
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (/User already registered/i.test(msg)) return "Este e-mail já tem acesso. Use a aba Entrar.";
  if (/Password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/rate limit|security purposes/i.test(msg))
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (/duplicate key|convite_unico/i.test(msg)) return "Esse convite já existe neste ciclo.";
  if (/violates row-level security/i.test(msg)) return "Você não tem permissão para esta ação.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Sem conexão com o servidor. Verifique sua internet.";
  return msg;
}
