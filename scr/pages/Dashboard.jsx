import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Star, AlertTriangle, EyeOff, Send, X, Check } from "lucide-react";
import { supabase, traduzErro } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useCiclos } from "../lib/dados";
import { consolidar, QUAD, TOM, FAIXA_TXT, faixa, fmt } from "../lib/ninebox";
import { Aviso, Cabecalho, Carregando, Pill, SeletorCiclo } from "../components/ui";

function Kpi({ icon: Ic, label, valor, sub, cor }) {
  return (
    <div className="cartao p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="rotulo">{label}</span>
        <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: cor.bg, color: cor.fg }}><Ic size={17} /></span>
      </div>
      <div className="num text-3xl font-semibold" style={{ color: cor.fg }}>{valor}</div>
      <p className="text-xs text-suave">{sub}</p>
    </div>
  );
}

function NotaFonte({ f }) {
  if (!f) return <span className="text-suave text-xs">Pendente</span>;
  return (
    <div>
      <span className="num font-semibold">{fmt(f.geral)}</span>
      <span className="block num text-[11px] text-suave">Y {fmt(f.y)} · X {fmt(f.x)}{f.n > 1 ? ` · ${f.n} aval.` : ""}</span>
    </div>
  );
}

export default function Dashboard() {
  const { isRH } = useAuth();
  const { ciclos, cicloId, setCicloId } = useCiclos();
  const [linhasBrutas, setLinhasBrutas] = useState(undefined);
  const [convites, setConvites] = useState({ total: 0, respondidos: 0 });
  const [gestores, setGestores] = useState([]);
  const [gestorFiltro, setGestorFiltro] = useState("");
  const [filtro, setFiltro] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (isRH) supabase.from("usuarios_autorizados").select("email,nome").order("nome").then(({ data }) => setGestores(data || []));
  }, [isRH]);

  useEffect(() => {
    if (!cicloId) { setLinhasBrutas(ciclos ? [] : undefined); return; }
    setLinhasBrutas(undefined); setErro(null);
    (async () => {
      const [r, c] = await Promise.all([
        supabase.from("respostas")
          .select("notas, convites!inner(tipo, ciclo_id, avaliado:colaboradores!convites_avaliado_id_fkey(id, nome, area, cargo, gestor_email))")
          .eq("convites.ciclo_id", cicloId),
        supabase.from("convites").select("status, avaliado:colaboradores!convites_avaliado_id_fkey(gestor_email)").eq("ciclo_id", cicloId),
      ]);
      if (r.error || c.error) { setErro(traduzErro(r.error || c.error)); setLinhasBrutas([]); return; }
      setLinhasBrutas(r.data);
      setConvites(c.data);
    })();
  }, [cicloId, ciclos]);

  const dados = useMemo(() => {
    if (!linhasBrutas) return [];
    return consolidar(
      linhasBrutas
        .filter((l) => !gestorFiltro || l.convites.avaliado.gestor_email === gestorFiltro)
        .map((l) => ({
          tipo: l.convites.tipo,
          avaliadoId: l.convites.avaliado.id,
          avaliadoNome: l.convites.avaliado.nome,
          extra: [l.convites.avaliado.cargo, l.convites.avaliado.area].filter(Boolean).join(" · "),
          notas: l.notas,
        }))
    );
  }, [linhasBrutas, gestorFiltro]);

  const conv = Array.isArray(convites) ? convites.filter((v) => !gestorFiltro || v.avaliado?.gestor_email === gestorFiltro) : [];
  const respondidos = conv.filter((v) => v.status === "respondido").length;

  if (ciclos === undefined) return <Carregando />;

  if (!ciclos.length)
    return (
      <div className="flex flex-col gap-6">
        <Cabecalho rotulo="Visão executiva" titulo="Dashboard Nine Box" />
        <div className="cartao p-10 text-center flex flex-col items-center gap-3">
          <h2 className="font-display text-xl font-bold text-verde">Nenhum ciclo de avaliação ainda</h2>
          <p className="text-sm text-suave max-w-md">
            {isRH ? "Crie o primeiro ciclo em Convites e links, cadastre a equipe e envie os links. Os resultados aparecem aqui conforme as respostas chegam."
                  : "O RH ainda não abriu um ciclo de avaliação. Assim que abrir, você poderá enviar os links da sua equipe."}
          </p>
          <Link to="/convites" className="btn-verde mt-2"><Send size={15} />Ir para Convites e links</Link>
        </div>
      </div>
    );

  const total = dados.length;
  const estrelas = dados.filter((d) => d.chave === "2-2").length;
  const loucos = dados.filter((d) => d.chave === "2-0").length;
  const insuf = dados.filter((d) => d.chave === "0-0").length;
  const cegos = dados.filter((d) => d.pontoCego).length;
  const tabela = filtro ? dados.filter((d) => d.chave === filtro) : dados;

  return (
    <div className="flex flex-col gap-7">
      <Cabecalho rotulo={isRH ? "Visão executiva · toda a empresa" : "Visão executiva · sua equipe"} titulo="Dashboard Nine Box"
        descricao="Nota final ponderada: Gestor 50% · Pares 30% · Auto 20%. Faixas: Baixo 1,0–2,9 · Médio 3,0–3,9 · Alto 4,0–5,0.">
        <SeletorCiclo ciclos={ciclos} cicloId={cicloId} setCicloId={(id) => { setCicloId(id); setFiltro(null); }} />
        {isRH && (
          <select id="filtro-gestor" className="campo h-10 w-auto" value={gestorFiltro} onChange={(e) => { setGestorFiltro(e.target.value); setFiltro(null); }}>
            <option value="">Todas as equipes</option>
            {gestores.map((g) => <option key={g.email} value={g.email}>Equipe de {g.nome}</option>)}
          </select>
        )}
      </Cabecalho>

      {erro && <Aviso>{erro}</Aviso>}
      {linhasBrutas === undefined ? <Carregando /> : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi icon={Users} label="Avaliados" valor={total} sub={`${dados.filter((d) => d.completo).length} com 360º completo`} cor={TOM.estrela} />
            <Kpi icon={Star} label="Quadrante Estrela" valor={total ? `${Math.round((estrelas / total) * 100)}%` : "0%"} sub={`${estrelas} de ${total} em Alto Potencial`} cor={TOM.bom} />
            <Kpi icon={AlertTriangle} label="Alertas" valor={loucos + insuf} sub={`${loucos} Cachorro Louco · ${insuf} Insuficiente`} cor={TOM.alerta} />
            <Kpi icon={EyeOff} label="Pontos cegos" valor={cegos} sub="Auto mais de 1,0 acima do gestor" cor={TOM.cinza} />
            <Kpi icon={Send} label="Respostas" valor={`${respondidos}/${conv.length}`} sub={conv.length ? `${Math.round((respondidos / conv.length) * 100)}% dos links respondidos` : "Nenhum link enviado"} cor={TOM.azul} />
          </div>

          {total === 0 ? (
            <div className="cartao p-10 text-center">
              <h2 className="font-display text-xl font-bold text-verde">Ainda sem respostas neste ciclo</h2>
              <p className="text-sm text-suave mt-2">Envie os links em <Link to="/convites" className="text-verde font-semibold underline">Convites e links</Link>. A matriz se preenche sozinha conforme as pessoas respondem.</p>
            </div>
          ) : (
            <>
              <section className="cartao p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="font-display text-xl font-bold text-verde">Matriz Nine Box</h2>
                  <p className="text-xs text-suave">Clique em um quadrante para filtrar a tabela</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center"><span className="rotulo [writing-mode:vertical-rl] rotate-180">Performance (Y) →</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-[22px_1fr_1fr_1fr] gap-2">
                      {[2, 1, 0].map((yb) => (
                        <div key={yb} className="contents">
                          <div className="flex items-center justify-center"><span className="rotulo [writing-mode:vertical-rl] rotate-180">{FAIXA_TXT[yb]}</span></div>
                          {[0, 1, 2].map((xb) => {
                            const k = `${yb}-${xb}`, q = QUAD[k], c = TOM[q.tom];
                            const gente = dados.filter((d) => d.chave === k);
                            const ativo = filtro === k;
                            return (
                              <button key={k} onClick={() => setFiltro(ativo ? null : k)} aria-pressed={ativo}
                                className="text-left rounded-lg p-3 min-h-[128px] flex flex-col gap-2 border-2 min-w-0 transition hover:shadow-md"
                                style={{ background: c.bg, borderColor: ativo ? c.fg : "transparent", opacity: filtro && !ativo ? 0.5 : 1 }}>
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[13px] font-bold leading-snug" style={{ color: c.fg }}>{q.nome}</span>
                                  <span className="num text-lg font-semibold leading-none" style={{ color: c.fg }}>{gente.length}</span>
                                </div>
                                <span className="text-[11px] text-suave leading-snug hidden sm:block">{q.desc}</span>
                                <div className="flex flex-wrap gap-1 mt-auto">
                                  {gente.map((g) => (
                                    <span key={g.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-papel border border-linha truncate max-w-full">{g.nome}</span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                      <div />
                      {[0, 1, 2].map((xb) => <div key={xb} className="text-center rotulo pt-1">{FAIXA_TXT[xb]}</div>)}
                    </div>
                    <p className="rotulo text-center mt-1">Cultura e Valores (X) →</p>
                  </div>
                </div>
              </section>

              <section className="cartao overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-linha">
                  <h2 className="font-display text-xl font-bold text-verde">Tabela consolidada da equipe</h2>
                  {filtro && (
                    <button onClick={() => setFiltro(null)}><Pill tom={TOM[QUAD[filtro].tom]}>{QUAD[filtro].nome}<X size={13} /></Pill></button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[940px]">
                    <thead>
                      <tr className="text-left bg-marfim">
                        {["Colaborador", "Nota Auto", "Nota Pares", "Nota Gestor", "Nota Final Y (Perf)", "Nota Final X (Cult)", "Quadrante Nine Box", "Análise de Ponto Cego"].map((h) => (
                          <th key={h} className="px-4 py-3 rotulo whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-linha">
                      {tabela.map((d) => (
                        <tr key={d.id} className="align-top">
                          <td className="px-4 py-3">
                            <span className="font-semibold">{d.nome}</span>
                            <span className="block text-[11px] text-suave">{d.extra || "—"}{!d.completo && " · 360º incompleto"}</span>
                          </td>
                          <td className="px-4 py-3"><NotaFonte f={d.fonte.auto} /></td>
                          <td className="px-4 py-3"><NotaFonte f={d.fonte.par} /></td>
                          <td className="px-4 py-3"><NotaFonte f={d.fonte.gestor} /></td>
                          <td className="px-4 py-3"><span className="num font-semibold text-base">{fmt(d.yFinal)}</span><span className="block text-[11px] text-suave">{FAIXA_TXT[faixa(d.yFinal)]}</span></td>
                          <td className="px-4 py-3"><span className="num font-semibold text-base">{fmt(d.xFinal)}</span><span className="block text-[11px] text-suave">{FAIXA_TXT[faixa(d.xFinal)]}</span></td>
                          <td className="px-4 py-3"><Pill tom={TOM[d.quadrante.tom]}>{d.quadrante.nome}</Pill></td>
                          <td className="px-4 py-3">
                            {d.pontoCego ? (
                              <Pill tom={TOM.alerta}><AlertTriangle size={13} />Superavaliado (Ponto Cego) <span className="num">+{fmt(d.fonte.auto.geral - d.fonte.gestor.geral)}</span></Pill>
                            ) : d.fonte.auto && d.fonte.gestor ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-verde font-semibold"><Check size={14} />Percepção alinhada</span>
                            ) : <span className="text-xs text-suave">Aguardando auto e gestor</span>}
                          </td>
                        </tr>
                      ))}
                      {tabela.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-suave">Ninguém neste quadrante.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
