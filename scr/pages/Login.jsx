import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, traduzErro } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Aviso } from "../components/ui";

const ABAS = [["entrar", "Entrar"], ["criar", "Primeiro acesso"], ["esqueci", "Esqueci a senha"]];

export default function Login() {
  const { sessao } = useAuth();
  const [aba, setAba] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  if (sessao) return <Navigate to="/painel" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setMsg(null); setOcupado(true);
    const em = email.trim().toLowerCase();
    try {
      if (aba === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: senha });
        if (error) throw error;
      } else if (aba === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: em, password: senha, options: { emailRedirectTo: `${window.location.origin}/painel` },
        });
        if (error) throw error;
        if (!data.session)
          setMsg({ tipo: "ok", texto: `Enviamos um e-mail de confirmação para ${em}. Clique no link recebido para ativar o acesso.` });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: `${window.location.origin}/redefinir-senha` });
        if (error) throw error;
        setMsg({ tipo: "ok", texto: `Se ${em} tiver acesso, você receberá um link para criar uma nova senha.` });
      }
    } catch (err) {
      setMsg({ tipo: "erro", texto: traduzErro(err) });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden lg:flex flex-col justify-between bg-papel border-r border-linha p-12">
        <img src="/logo-rdf.png" alt="RDF Consultoria" className="w-64 h-64 object-contain -ml-4" />
        <div className="max-w-md">
          <p className="rotulo text-ouro-600">Avaliação 360º · Matriz Nine Box</p>
          <h1 className="font-display text-4xl font-bold text-verde mt-3 leading-tight">Performance e cultura, lado a lado.</h1>
          <p className="text-suave mt-4 leading-relaxed">
            Envie os links de avaliação, acompanhe quem já respondeu e veja cada pessoa posicionada na matriz com o cálculo ponderado Gestor 50% · Pares 30% · Auto 20%.
          </p>
        </div>
        <p className="text-xs text-suave">Acesso restrito a RH e gestores cadastrados.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <img src="/logo-rdf.png" alt="RDF Consultoria" className="lg:hidden w-36 h-36 object-contain mx-auto" />
          <div>
            <h2 className="font-display text-3xl font-bold text-verde">Painel de avaliação</h2>
            <p className="text-sm text-suave mt-1">Entre com o e-mail cadastrado pelo RH.</p>
          </div>

          <div className="flex bg-cinza-50 rounded-lg p-1 gap-1" role="tablist">
            {ABAS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={aba === id} onClick={() => { setAba(id); setMsg(null); }}
                className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-semibold ${aba === id ? "bg-papel text-verde shadow-sm" : "text-suave hover:text-tinta"}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">E-mail</span>
              <input id="email" type="email" required autoComplete="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com.br" />
            </label>
            {aba !== "esqueci" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">{aba === "criar" ? "Crie uma senha" : "Senha"}</span>
                <input id="senha" type="password" required minLength={6} autoComplete={aba === "criar" ? "new-password" : "current-password"} className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
                {aba === "criar" && <span className="text-xs text-suave">Mínimo de 6 caracteres. Só funciona para e-mails liberados pelo RH.</span>}
              </label>
            )}
            {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
            <button type="submit" disabled={ocupado} className="btn-verde h-11">
              {ocupado ? "Aguarde…" : aba === "entrar" ? "Entrar" : aba === "criar" ? "Criar meu acesso" : "Enviar link de redefinição"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
