import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, traduzErro } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Aviso, Carregando, Marca } from "../components/ui";

export default function RedefinirSenha() {
  const { sessao } = useAuth();
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  if (sessao === undefined) return <Carregando />;

  const salvar = async (e) => {
    e.preventDefault();
    setOcupado(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setOcupado(false);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setMsg({ tipo: "ok", texto: "Senha alterada. Redirecionando para o painel…" });
    setTimeout(() => navigate("/painel"), 1200);
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="cartao p-8 w-full max-w-sm flex flex-col gap-5">
        <Marca />
        <h1 className="font-display text-2xl font-bold text-verde">Criar nova senha</h1>
        {!sessao ? (
          <Aviso>Este link expirou ou já foi usado. Volte ao login e peça um novo em “Esqueci a senha”.</Aviso>
        ) : (
          <form onSubmit={salvar} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Nova senha</span>
              <input id="nova-senha" type="password" minLength={6} required className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
            </label>
            {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
            <button className="btn-verde h-11" disabled={ocupado}>{ocupado ? "Salvando…" : "Salvar senha"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
