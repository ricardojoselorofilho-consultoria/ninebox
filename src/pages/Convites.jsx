import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Link2, Trash2, X, Lock, Unlock, Search, MessageSquareText, CheckCircle2, Clock } from "lucide-react";
import { supabase, traduzErro } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useCiclos } from "../lib/dados";
import { TIPOS } from "../lib/ninebox";
import { Aviso, BotaoCopiar, Cabecalho, Carregando, SeletorCiclo } from "../components/ui";

const urlDo = (token) => `${window.location.origin}/avaliar/${token}`;
const descricao = (c) => (c.tipo === "auto" ? "Autoavaliação" : `Avaliar ${c.avaliado.nome} (${TIPOS[c.tipo].curto.toLowerCase()})`);

function mensagemPara(avaliador, itens, cicloNome) {
  const primeiro = avaliador.split(" ")[0];
  const corpo = itens.map((c, i) => `${i + 1}) ${c.tipo === "auto" ? "Sua autoavaliação" : `Avaliação de ${c.avaliado.nome}`}:\n${urlDo(c.token)}`).join("\n\n");
  return `Olá, ${primeiro}! Você foi convidado(a) para o ${cicloNome} da Avaliação 360º.\n\n${corpo}\n\nCada formulário tem 20 perguntas e leva cerca de 5 minutos. As respostas são confidenciais.`;
}

export default function Convites() {
  const { isRH, email: meuEmail } = useAuth();
  const { ciclos, cicloId, setCicloId, ciclo, recarregar } = useCiclos();
  const [colabs, setColabs] = useState([]);
  const [convites, setConvites] = useState(undefined);
  const [msg, setMsg] = useState(null);
  const [novoCiclo, setNovoCiclo] = useState(null);
  const [montar, setMontar] = useState({ avaliado: "", auto: true, gestor: "", pares: [] });
  const [filtro, setFiltro] = useState("pendente");
  const [busca, setBusca] = useState("");
  const [gerando, setGerando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);

  useEffect(() => {
    supabase.from("colaboradores").select("id,nome,email,area,gestor_email,ativo").eq("ativo", true).order("nome").then(({ data }) => setColabs(data || []));
  }, []);

  const carregarConvites = async () => {
    if (!cicloId) { setConvites([]); return; }
    const { data, error } = await supabase.from("convites")
      .select("id, token, tipo, status, respondido_em, created_at, avaliador:colaboradores!convites_avaliador_id_fkey(id,nome), avaliado:colaboradores!convites_avaliado_id_fkey(id,nome,gestor_email)")
      .eq("ciclo_id", cicloId).order("created_at");
    if (error) setMsg({ tipo: "erro", texto: traduzErro(error) });
    setConvites(data || []);
  };
  useEffect(() => { setConvites(undefined); carregarConvites(); }, [cicloId]); // eslint-disable-line react-hooks/exhaustive-deps

  const minhaEquipe = useMemo(() => colabs.filter((c) => isRH || c.gestor_email === meuEmail), [colabs, isRH, meuEmail]);
  const avaliadoSel = colabs.find((c) => c.id === montar.avaliado);

  const escolherAvaliado = (id) => {
    const a = colabs.find((c) => c.id === id);
    const gestorColab = a?.gestor_email ? colabs.find((c) => c.email && c.email.toLowerCase() === a.gestor_email) : null;
    setMontar({ avaliado: id, auto: true, gestor: gestorColab && gestorColab.id !== id ? gestorColab.id : "", pares: [] });
  };

  const gerar = async () => {
    if (!avaliadoSel) return;
    const linhas = [];
    if (montar.auto) linhas.push({ tipo: "auto", avaliador_id: avaliadoSel.id });
    if (montar.gestor) linhas.push({ tipo: "gestor", avaliador_id: montar.gestor });
    montar.pares.forEach((p) => linhas.push({ tipo: "par", avaliador_id: p }));
    if (!linhas.length) return setMsg({ tipo: "erro", texto: "Marque pelo menos um tipo de avaliação." });
    setGerando(true); setMsg(null);
    const { error } = await supabase.from("convites")
      .upsert(linhas.map((l) => ({ ...l, ciclo_id: cicloId, avaliado_id: avaliadoSel.id })), { onConflict: "ciclo_id,tipo,avaliador_id,avaliado_id", ignoreDuplicates: true });
    setGerando(false);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setMsg({ tipo: "ok", texto: `Links da avaliação de ${avaliadoSel.nome} gerados. Copie e envie abaixo, por avaliador.` });
    setMontar({ avaliado: "", auto: true, gestor: "", pares: [] });
    setFiltro("pendente");
    carregarConvites();
  };

  const excluir = async (c) => {
    const { error } = await supabase.from("convites").delete().eq("id", c.id);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    carregarConvites();
  };

  const criarCiclo = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from("ciclos").insert({ nome: novoCiclo.trim() }).select().single();
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    setNovoCiclo(null);
    await recarregar();
    setCicloId(data.id);
  };

  const alternarCiclo = async () => {
    const { error } = await supabase.from("ciclos").update({ status: ciclo.status === "aberto" ? "encerrado" : "aberto" }).eq("id", ciclo.id);
    if (error) return setMsg({ tipo: "erro", texto: traduzErro(error) });
    recarregar();
  };

  const grupos = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const g = {};
    (convites || [])
      .filter((c) => filtro === "todos" || c.status === filtro)
      .filter((c) => !t || c.avaliador.nome.toLowerCase().includes(t) || c.avaliado.nome.toLowerCase().includes(t))
      .forEach((c) => { (g[c.avaliador.id] ||= { nome: c.avaliador.nome, itens: [] }).itens.push(c); });
    return Object.values(g).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [convites, filtro, busca]);

  const pend = (convites || []).filter((c) => c.status === "pendente").length;
  const resp = (convites || []).filter((c) => c.status === "respondido").length;

  if (ciclos === undefined) return <Carregando />;

  const formCiclo = novoCiclo !== null && (
    <form onSubmit={criarCiclo} className="cartao p-4 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
        <span className="text-sm font-semibold">Nome do novo ciclo</span>
        <input id="novo-ciclo" autoFocus required className="campo" value={novoCiclo} onChange={(e) => setNovoCiclo(e.target.value)} placeholder="Ex.: Ciclo 2º semestre 2026" />
      </label>
      <button type="button" className="btn-linha" onClick={() => setNovoCiclo(null)}>Cancelar</button>
      <button type="submit" className="btn-verde"><Plus size={15} />Criar ciclo</button>
    </form>
  );

  if (!ciclos.length)
    return (
      <div className="flex flex-col gap-6">
        <Cabecalho rotulo="Envio" titulo="Convites e links" />
        {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
        {isRH ? (formCiclo || (
          <div className="cartao p-10 text-center flex flex-col items-center gap-3">
            <h2 className="font-display text-xl font-bold text-verde">Comece criando um ciclo de avaliação</h2>
            <p className="text-sm text-suave max-w-md">O ciclo agrupa os convites e respostas de um período (por exemplo, um semestre).</p>
            <button className="btn-verde" onClick={() => setNovoCiclo("")}><Plus size={15} />Criar primeiro ciclo</button>
          </div>
        )) : <Aviso>O RH ainda não abriu nenhum ciclo de avaliação.</Aviso>}
      </div>
    );

  const aberto = ciclo?.status === "aberto";
  const candidatosPar = colabs.filter((c) => c.id !== montar.avaliado && c.id !== montar.gestor && !montar.pares.includes(c.id));

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho rotulo="Envio" titulo="Convites e links"
        descricao="Escolha quem será avaliado e por quem. Cada avaliador recebe um link pessoal, que só vale para aquela avaliação e deixa de funcionar depois de respondido.">
        <SeletorCiclo ciclos={ciclos} cicloId={cicloId} setCicloId={setCicloId} />
        {isRH && ciclo && (
          <button className="btn-linha" onClick={alternarCiclo}>{aberto ? <><Lock size={15} />Encerrar ciclo</> : <><Unlock size={15} />Reabrir ciclo</>}</button>
        )}
        {isRH && <button className="btn-linha" onClick={() => setNovoCiclo("")}><Plus size={15} />Novo ciclo</button>}
      </Cabecalho>

      {formCiclo}
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      {!aberto && <Aviso>Este ciclo está encerrado: os links não aceitam novas respostas. {isRH ? "Reabra para continuar." : "Fale com o RH para reabrir."}</Aviso>}

      {/* ---------- Montar avaliação ---------- */}
      {aberto && (
        <section className="cartao p-5 flex flex-col gap-5">
          <div>
            <h2 className="font-display text-xl font-bold text-verde">Montar avaliação 360º</h2>
            <p className="text-sm text-suave mt-1">
              {minhaEquipe.length ? "Selecione o colaborador avaliado e defina quem vai avaliá-lo." :
                <>Nenhum colaborador cadastrado {isRH ? "" : "na sua equipe "}ainda. <Link className="text-verde font-semibold underline" to="/colaboradores">Cadastrar colaboradores</Link></>}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">1. Quem será avaliado?</span>
              <select id="avaliado" className="campo" value={montar.avaliado} onChange={(e) => escolherAvaliado(e.target.value)}>
                <option value="">Selecione o colaborador…</option>
                {minhaEquipe.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.area ? ` · ${c.area}` : ""}</option>)}
              </select>
            </label>

            {avaliadoSel && (
              <div className="flex flex-col gap-4">
                <span className="text-sm font-semibold">2. Quem vai avaliar {avaliadoSel.nome.split(" ")[0]}?</span>

                <label className="flex items-center gap-3 rounded-lg border border-linha px-3 py-2.5 cursor-pointer">
                  <input id="incluir-auto" type="checkbox" className="w-4 h-4 accent-[#0b3d2c]" checked={montar.auto} onChange={(e) => setMontar({ ...montar, auto: e.target.checked })} />
                  <span className="text-sm"><strong>Autoavaliação</strong> · o próprio {avaliadoSel.nome} <span className="text-suave">(peso 20%)</span></span>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm"><strong>Gestor direto</strong> <span className="text-suave">(peso 50%)</span></span>
                  <select id="avaliador-gestor" className="campo" value={montar.gestor} onChange={(e) => setMontar({ ...montar, gestor: e.target.value, pares: montar.pares.filter((p) => p !== e.target.value) })}>
                    <option value="">Não incluir avaliação de gestor</option>
                    {colabs.filter((c) => c.id !== avaliadoSel.id).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </label>

                <div className="flex flex-col gap-1.5">
                  <span className="text-sm"><strong>Pares / colegas</strong> <span className="text-suave">(peso 30%, média entre os pares)</span></span>
                  <div className="flex flex-wrap gap-1.5">
                    {montar.pares.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 text-xs font-semibold bg-ouro-50 text-ouro-600 rounded-full pl-3 pr-1.5 py-1">
                        {colabs.find((c) => c.id === p)?.nome}
                        <button type="button" aria-label="Remover par" className="hover:text-alerta" onClick={() => setMontar({ ...montar, pares: montar.pares.filter((x) => x !== p) })}><X size={13} /></button>
                      </span>
                    ))}
                  </div>
                  <select id="adicionar-par" className="campo" value="" onChange={(e) => e.target.value && setMontar({ ...montar, pares: [...montar.pares, e.target.value] })}>
                    <option value="">+ Adicionar par…</option>
                    {candidatosPar.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.area ? ` · ${c.area}` : ""}</option>)}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button className="btn-verde h-11" disabled={gerando} onClick={gerar}><Link2 size={16} />{gerando ? "Gerando…" : "Gerar links"}</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- Links por avaliador ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-verde">Links para enviar</h2>
            <p className="text-sm text-suave">Agrupados por quem responde. Use “Copiar mensagem” para mandar todos os links da pessoa de uma vez.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-cinza-50 rounded-lg p-1 gap-1">
              {[["pendente", `Pendentes (${pend})`], ["respondido", `Respondidos (${resp})`], ["todos", "Todos"]].map(([id, l]) => (
                <button key={id} onClick={() => setFiltro(id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${filtro === id ? "bg-papel text-verde shadow-sm" : "text-suave"}`}>{l}</button>
              ))}
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-suave" />
              <input id="busca-convite" className="campo h-10 pl-9 w-56" placeholder="Buscar pessoa…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
        </div>

        {convites === undefined ? <Carregando /> : grupos.length === 0 ? (
          <div className="cartao p-8 text-center text-sm text-suave">
            {convites.length ? "Nada neste filtro." : "Nenhum link gerado neste ciclo ainda. Use “Montar avaliação 360º” acima."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {grupos.map((g) => {
              const pendentes = g.itens.filter((c) => c.status === "pendente");
              return (
                <article key={g.nome} className="cartao flex flex-col">
                  <header className="px-4 py-3 border-b border-linha flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{g.nome}</h3>
                      <p className="text-xs text-suave">{g.itens.length} avaliação(ões) para responder</p>
                    </div>
                    {pendentes.length > 0 && aberto && (
                      <BotaoCopiar texto={mensagemPara(g.nome, pendentes, ciclo?.nome || "ciclo")} rotulo="Copiar mensagem" className="btn-ouro h-9 px-3 text-xs shrink-0" />
                    )}
                  </header>
                  <ul className="divide-y divide-linha">
                    {g.itens.map((c) => (
                      <li key={c.id} className="px-4 py-3 flex items-center gap-3">
                        {c.status === "respondido"
                          ? <CheckCircle2 size={17} className="text-verde shrink-0" aria-label="Respondido" />
                          : <Clock size={17} className="text-ouro shrink-0" aria-label="Pendente" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{descricao(c)}</p>
                          <p className="text-[11px] text-suave">
                            {c.status === "respondido" ? `Respondido em ${new Date(c.respondido_em).toLocaleDateString("pt-BR")}` : "Aguardando resposta"}
                          </p>
                        </div>
                        {c.status === "pendente" && (
                          <>
                            <BotaoCopiar texto={urlDo(c.token)} rotulo="Link" className="btn-linha h-8 px-2.5 text-xs" />
                            <button className="btn-texto hover:text-alerta" title="Excluir convite" onClick={() => excluir(c)}><Trash2 size={15} /></button>
                          </>
                        )}
                        {c.status === "respondido" && isRH && (confirmar === c.id ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="text-alerta">Apagar a resposta?</span>
                            <button className="btn h-7 px-2 bg-alerta text-white text-xs" onClick={() => { setConfirmar(null); excluir(c); }}>Apagar</button>
                            <button className="btn-linha h-7 px-2 text-xs" onClick={() => setConfirmar(null)}>Não</button>
                          </span>
                        ) : (
                          <button className="btn-texto hover:text-alerta" title="Excluir convite e resposta" onClick={() => setConfirmar(c.id)}><Trash2 size={15} /></button>
                        ))}
                      </li>
                    ))}
                  </ul>
                  {pendentes.length > 0 && aberto && (
                    <details className="px-4 py-3 border-t border-linha text-xs mt-auto">
                      <summary className="cursor-pointer text-suave flex items-center gap-1.5"><MessageSquareText size={14} />Ver mensagem antes de copiar</summary>
                      <pre className="mt-2 whitespace-pre-wrap break-all font-sans text-tinta bg-marfim rounded-lg p-3">{mensagemPara(g.nome, pendentes, ciclo?.nome || "ciclo")}</pre>
                    </details>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
