import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Upload, Search, UserX, UserCheck } from "lucide-react";
import { supabase, traduzErro } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Aviso, Cabecalho, Carregando } from "../components/ui";

const VAZIO = { id: null, nome: "", email: "", area: "", cargo: "", gestor_email: "" };

export default function Colaboradores() {
  const { isRH, email: meuEmail } = useAuth();
  const [lista, setLista] = useState(undefined);
  const [gestores, setGestores] = useState([]);
  const [form, setForm] = useState(null);
  const [importar, setImportar] = useState(null);
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState(null);

  const carregar = async () => {
    const { data, error } = await supabase.from("colaboradores").select("*").order("nome");
    if (error) setMsg({ tipo: "erro", texto: traduzErro(error) });
    setLista(data || []);
  };

  useEffect(() => {
    carregar();
    supabase.from("usuarios_autorizados").select("email,nome,papel").order("nome").then(({ data }) => setGestores(data || []));
  }, []);

  const nomeGestor = (em) => gestores.find((g) => g.email === em)?.nome || em || "Sem gestor";

  const visiveis = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (lista || [])
      .filter((c) => isRH || c.gestor_email === meuEmail)
      .filter((c) => !t || [c.nome, c.email, c.area, c.cargo].some((v) => (v || "").toLowerCase().includes(t)));
  }, [lista, busca, isRH, meuEmail]);

  const salvar = async (e) => {
    e.preventDefault();
    setMsg(null);
    const reg = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase() || null,
      area: form.area.trim() || null,
      cargo: form.cargo.trim() || null,
      gestor_email: isRH ? form.gestor_email || null : meuEmail,
    };
    const q = form.id ? supabase.from("colaboradores").update(reg).eq("id", form.id) : supabase.from("colaboradores").insert(reg);
    const { error } = await q;
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setMsg({ tipo: "ok", texto: `${reg.nome} ${form.id ? "atualizado(a)" : "cadastrado(a)"}.` });
    setForm(null);
    carregar();
  };

  const processarImportacao = async () => {
    const linhas = importar.texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const regs = linhas.map((l) => {
      const [nome, email, area, cargo] = l.split(/[;\t]/).map((s) => (s || "").trim());
      return { nome, email: (email || "").toLowerCase() || null, area: area || null, cargo: cargo || null, gestor_email: isRH ? importar.gestor || null : meuEmail };
    }).filter((r) => r.nome);
    if (!regs.length) return setMsg({ tipo: "erro", texto: "Nenhuma linha válida. Use o formato: Nome; e-mail; área; cargo" });
    const { error } = await supabase.from("colaboradores").insert(regs);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setMsg({ tipo: "ok", texto: `${regs.length} colaborador(es) importado(s).` });
    setImportar(null);
    carregar();
  };

  const alternarAtivo = async (c) => {
    const { error } = await supabase.from("colaboradores").update({ ativo: !c.ativo }).eq("id", c.id);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    carregar();
  };

  const excluir = async (c) => {
    const { error } = await supabase.from("colaboradores").delete().eq("id", c.id);
    setConfirmarExcluir(null);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setMsg({ tipo: "ok", texto: `${c.nome} foi excluído(a), junto com seus convites e respostas.` });
    carregar();
  };

  const SelectGestor = ({ id, valor, onChange }) => (
    <select id={id} className="campo" value={valor} onChange={(e) => onChange(e.target.value)}>
      <option value="">Sem gestor definido</option>
      {gestores.map((g) => <option key={g.email} value={g.email}>{g.nome} ({g.papel === "rh" ? "RH" : "Gestor"})</option>)}
    </select>
  );

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho rotulo="Cadastro" titulo={isRH ? "Colaboradores" : "Minha equipe"}
        descricao={isRH
          ? "Cadastre todas as pessoas que vão avaliar ou ser avaliadas. O gestor escolhido aqui é quem verá os resultados dessa pessoa."
          : "Pessoas da sua equipe. Você vê os resultados delas no dashboard."}>
        <button className="btn-linha" onClick={() => { setImportar({ texto: "", gestor: "" }); setForm(null); }}><Upload size={15} />Importar lista</button>
        <button className="btn-verde" onClick={() => { setForm({ ...VAZIO }); setImportar(null); }}><Plus size={15} />Novo colaborador</button>
      </Cabecalho>

      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}

      {form && (
        <form onSubmit={salvar} className="cartao p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <h2 className="font-display text-lg font-bold text-verde sm:col-span-2 lg:col-span-3">{form.id ? "Editar colaborador" : "Novo colaborador"}</h2>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Nome completo *</span>
            <input id="col-nome" required className="campo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">E-mail</span>
            <input id="col-email" type="email" className="campo" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Opcional" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Área</span>
            <input id="col-area" className="campo" value={form.area || ""} onChange={(e) => setForm({ ...form, area: e.target.value })} /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Cargo</span>
            <input id="col-cargo" className="campo" value={form.cargo || ""} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></label>
          {isRH && (
            <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Gestor responsável</span>
              {SelectGestor({ id: "col-gestor", valor: form.gestor_email || "", onChange: (v) => setForm({ ...form, gestor_email: v }) })}</label>
          )}
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3 justify-end">
            <button type="button" className="btn-linha" onClick={() => setForm(null)}>Cancelar</button>
            <button type="submit" className="btn-verde">Salvar</button>
          </div>
          <p className="text-xs text-suave sm:col-span-2 lg:col-span-3">Dica: para um gestor avaliar a equipe, cadastre-o também aqui como colaborador.</p>
        </form>
      )}

      {importar && (
        <div className="cartao p-5 flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-verde">Importar lista</h2>
          <p className="text-sm text-suave">Uma pessoa por linha, separando com ponto e vírgula (ou cole direto de uma planilha): <span className="num text-tinta">Nome; e-mail; área; cargo</span></p>
          <textarea id="importar" rows={6} className="campo h-auto py-2 num text-xs" value={importar.texto} onChange={(e) => setImportar({ ...importar, texto: e.target.value })}
            placeholder={"Ana Ribeiro; ana@empresa.com.br; Comercial; Executiva de Contas\nCarla Mendes; carla@empresa.com.br; Operações; Analista"} />
          {isRH && <div className="max-w-sm"><span className="text-sm font-semibold">Gestor dessas pessoas</span>
            {SelectGestor({ id: "importar-gestor", valor: importar.gestor, onChange: (v) => setImportar({ ...importar, gestor: v }) })}</div>}
          <div className="flex gap-2 justify-end">
            <button className="btn-linha" onClick={() => setImportar(null)}>Cancelar</button>
            <button className="btn-verde" onClick={processarImportacao}><Upload size={15} />Importar</button>
          </div>
        </div>
      )}

      <section className="cartao overflow-hidden">
        <div className="px-5 py-3 border-b border-linha flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-suave" />
            <input id="busca-colab" className="campo h-10 pl-9" placeholder="Buscar nome, área, cargo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <span className="text-xs text-suave num">{visiveis.length} pessoa(s)</span>
        </div>
        {lista === undefined ? <Carregando /> : visiveis.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-suave">Nenhum colaborador ainda. Use “Novo colaborador” ou “Importar lista”.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead><tr className="text-left bg-marfim">
                {["Nome", "Área · Cargo", isRH ? "Gestor" : "E-mail", "Situação", ""].map((h, i) => <th key={i} className="px-4 py-3 rotulo">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-linha">
                {visiveis.map((c) => (
                  <tr key={c.id} className={c.ativo ? "" : "opacity-60"}>
                    <td className="px-4 py-3"><span className="font-semibold">{c.nome}</span>{isRH && c.email && <span className="block text-xs text-suave">{c.email}</span>}</td>
                    <td className="px-4 py-3 text-suave">{[c.area, c.cargo].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="px-4 py-3 text-suave">{isRH ? nomeGestor(c.gestor_email) : c.email || "—"}</td>
                    <td className="px-4 py-3">{c.ativo ? <span className="text-xs font-semibold text-verde">Ativo</span> : <span className="text-xs font-semibold text-cinza">Inativo</span>}</td>
                    <td className="px-4 py-3">
                      {confirmarExcluir === c.id ? (
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <span className="text-alerta">Excluir também convites e respostas?</span>
                          <button className="btn h-8 px-3 bg-alerta text-white" onClick={() => excluir(c)}>Excluir</button>
                          <button className="btn-linha h-8 px-3" onClick={() => setConfirmarExcluir(null)}>Não</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button className="btn-texto" title="Editar" onClick={() => { setForm({ ...VAZIO, ...c }); setImportar(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={15} /></button>
                          <button className="btn-texto" title={c.ativo ? "Desativar" : "Reativar"} onClick={() => alternarAtivo(c)}>{c.ativo ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                          <button className="btn-texto hover:text-alerta" title="Excluir" onClick={() => setConfirmarExcluir(c.id)}><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
