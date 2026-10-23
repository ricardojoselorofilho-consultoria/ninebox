import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase, traduzErro } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Aviso, BotaoCopiar, Cabecalho, Carregando } from "../components/ui";

export default function Usuarios() {
  const { email: meuEmail } = useAuth();
  const [lista, setLista] = useState(undefined);
  const [form, setForm] = useState({ nome: "", email: "", papel: "gestor" });
  const [msg, setMsg] = useState(null);
  const [confirmar, setConfirmar] = useState(null);

  const carregar = async () => {
    const { data } = await supabase.from("usuarios_autorizados").select("*").order("papel", { ascending: false }).order("nome");
    setLista(data || []);
  };
  useEffect(() => { carregar(); }, []);

  const adicionar = async (e) => {
    e.preventDefault();
    setMsg(null);
    const reg = { nome: form.nome.trim(), email: form.email.trim().toLowerCase(), papel: form.papel };
    const { error } = await supabase.from("usuarios_autorizados").insert(reg);
    if (error) return setMsg({ tipo: "erro", texto: /duplicate/i.test(error.message) ? "Este e-mail já está cadastrado." : traduzErro(error) });
    setMsg({ tipo: "ok", texto: `${reg.nome} liberado(a). Envie o endereço do painel e peça para usar “Primeiro acesso” com ${reg.email}.` });
    setForm({ nome: "", email: "", papel: "gestor" });
    carregar();
  };

  const remover = async (u) => {
    const { error } = await supabase.from("usuarios_autorizados").delete().eq("email", u.email);
    setConfirmar(null);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setMsg({ tipo: "ok", texto: `Acesso de ${u.nome} removido. Os colaboradores da equipe dele(a) ficaram sem gestor; ajuste em Colaboradores.` });
    carregar();
  };

  const mudarPapel = async (u, papel) => {
    const { error } = await supabase.from("usuarios_autorizados").update({ papel }).eq("email", u.email);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    carregar();
  };

  const endereco = `${window.location.origin}/login`;

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho rotulo="Acesso" titulo="Usuários do painel"
        descricao="Somente os e-mails desta lista conseguem criar conta e ver o dashboard. RH vê toda a empresa; Gestor vê apenas a própria equipe.">
        <BotaoCopiar texto={endereco} rotulo="Copiar endereço do painel" />
      </Cabecalho>

      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}

      <form onSubmit={adicionar} className="cartao p-5 grid gap-4 sm:grid-cols-[1fr_1fr_160px_auto] items-end">
        <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Nome</span>
          <input id="usr-nome" required className="campo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">E-mail de acesso</span>
          <input id="usr-email" type="email" required className="campo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Papel</span>
          <select id="usr-papel" className="campo" value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}>
            <option value="gestor">Gestor</option><option value="rh">RH</option>
          </select></label>
        <button className="btn-verde h-11"><Plus size={15} />Liberar acesso</button>
      </form>

      <section className="cartao overflow-hidden">
        {lista === undefined ? <Carregando /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead><tr className="text-left bg-marfim">{["Nome", "E-mail", "Papel", ""].map((h, i) => <th key={i} className="px-4 py-3 rotulo">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-linha">
                {lista.map((u) => {
                  const eu = u.email === meuEmail;
                  return (
                    <tr key={u.email}>
                      <td className="px-4 py-3 font-semibold">{u.nome}{eu && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-ouro-600">você</span>}</td>
                      <td className="px-4 py-3 text-suave">{u.email}</td>
                      <td className="px-4 py-3">
                        <select id={`papel-${u.email}`} disabled={eu} className="campo h-9 w-32" value={u.papel} onChange={(e) => mudarPapel(u, e.target.value)}>
                          <option value="gestor">Gestor</option><option value="rh">RH</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {eu ? null : confirmar === u.email ? (
                          <span className="inline-flex items-center gap-2 text-xs">
                            <span className="text-alerta">Remover acesso?</span>
                            <button className="btn h-8 px-3 bg-alerta text-white" onClick={() => remover(u)}>Remover</button>
                            <button className="btn-linha h-8 px-3" onClick={() => setConfirmar(null)}>Não</button>
                          </span>
                        ) : (
                          <button className="btn-texto hover:text-alerta" title="Remover acesso" onClick={() => setConfirmar(u.email)}><Trash2 size={15} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
