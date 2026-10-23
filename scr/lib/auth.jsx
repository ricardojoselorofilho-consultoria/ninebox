import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando
  const [papel, setPapel] = useState(undefined);
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (!supabase) { setSessao(null); return; }
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao) { setPapel(sessao === null ? null : undefined); return; }
    let ativo = true;
    (async () => {
      const { data } = await supabase.rpc("meu_papel");
      if (!ativo) return;
      setPapel(data || null);
      if (data) {
        const { data: u } = await supabase
          .from("usuarios_autorizados").select("nome").eq("email", sessao.user.email.toLowerCase()).maybeSingle();
        if (ativo) setNome(u?.nome || "");
      }
    })();
    return () => { ativo = false; };
  }, [sessao]);

  const sair = () => supabase.auth.signOut();

  return (
    <AuthCtx.Provider value={{ sessao, papel, nome, email: sessao?.user?.email?.toLowerCase() || "", isRH: papel === "rh", sair }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
