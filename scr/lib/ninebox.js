/* =========================================================
   Questionário, quadrantes e motor de cálculo Nine Box
   ========================================================= */

export const PERGUNTAS = [
  ["Atingimento de Metas", "Entrega com consistência as metas numéricas, OKRs e KPIs individuais."],
  ["Geração de Valor Real", "Garante que suas entregas tragam impacto prático e resultado efetivo."],
  ["Controle de Inputs", "Acompanha e gerencia no detalhe os indicadores diários de processo."],
  ["Qualidade Técnica", "Mantém alto padrão na execução, evitando falhas e retrabalho."],
  ["Análise de Causa Raiz (FCA)", "Investigação profunda dos problemas sem dar desculpas."],
  ["Planos de Ação Práticos", "Apresenta e executa planos de ação rápidos para corrigir rota."],
  ["Priorização Estratégica", "Organiza a rotina sabendo diferenciar tarefas urgentes de entregas de valor."],
  ["Autonomia de Execução", "Conduz suas rotinas diárias sem necessidade de microgestão."],
  ["Rigor com Prazos", "Cumpre com disciplina os acionáveis e compromissos assumidos."],
  ["Evolução Técnica", "Busca constantemente aperfeiçoar seus conhecimentos e produtividade."],
  ["Teste da Ausência", "Mantém comportamento ético e alinhado aos valores quando a liderança não está presente."],
  ["Transparência e Humildade", "Assume erros com maturidade e tem alta receptividade a feedbacks."],
  ["Zelo e Mindset de Dono", "Cuida dos custos e ativos da empresa como se fossem seus."],
  ["Proatividade e Garra", "Importa-se genuinamente com o negócio, agindo por iniciativa própria."],
  ["Busca pela Excelência", "Recusa a mediocridade, elevando a régua de exigência pessoal e do time."],
  ["Resiliência", "Mantém o equilíbrio, foco e postura em períodos de alta pressão ou mudanças."],
  ["Visão de Máximo Global", "Prioriza os objetivos gerais da empresa acima de vaidades pessoais/área."],
  ["Combate a Comportamentos Nocivos", "Abomina fofocas, intrigas ou atitudes tóxicas no ambiente."],
  ["Exemplo Prático", "Atua como modelo de referência na vivência dos valores da empresa."],
  ["Cooperação Interdepartamental", "Trabalha em colaboração fluida com outras áreas."],
];

export const LIKERT = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"];

export const TIPOS = {
  auto: { label: "Autoavaliação", curto: "Auto", peso: 0.2 },
  par: { label: "Avaliação por Par/Colega", curto: "Par", peso: 0.3 },
  gestor: { label: "Avaliação pelo Gestor Direto", curto: "Gestor", peso: 0.5 },
};

/* chave = faixaY-faixaX (0 baixo, 1 médio, 2 alto) */
export const QUAD = {
  "2-2": { nome: "Alto Potencial (Estrela)", desc: "Alta entrega e referência de cultura", tom: "estrela" },
  "2-1": { nome: "Forte Desempenho", desc: "Alta entrega, cultura no esperado", tom: "bom" },
  "2-0": { nome: "Diamante Bruto (Cachorro Louco)", desc: "Entrega alta, cultura abaixo do esperado", tom: "alerta" },
  "1-2": { nome: "Eficaz", desc: "Cultura forte, entrega no esperado", tom: "bom" },
  "1-1": { nome: "Mantenedor", desc: "Entrega e cultura no esperado", tom: "neutro" },
  "1-0": { nome: "Questionável", desc: "Entrega no esperado, cultura abaixo", tom: "cinza" },
  "0-2": { nome: "Comprometido", desc: "Vive a cultura, entrega abaixo", tom: "azul" },
  "0-1": { nome: "Em Desenvolvimento", desc: "Entrega abaixo, cultura no esperado", tom: "cinza" },
  "0-0": { nome: "Insuficiente", desc: "Entrega e cultura abaixo do esperado", tom: "alerta" },
};

export const TOM = {
  estrela: { bg: "#dcebe2", fg: "#0b3d2c" },
  bom: { bg: "#f6eddf", fg: "#8a6326" },
  azul: { bg: "#e3ecf4", fg: "#2c5e8a" },
  neutro: { bg: "#efeee7", fg: "#16261f" },
  cinza: { bg: "#eeefeb", fg: "#5d6661" },
  alerta: { bg: "#f9e4e1", fg: "#b23a2e" },
};

export const FAIXA_TXT = ["Baixo", "Médio", "Alto"];
export const faixa = (v) => (v >= 4 ? 2 : v >= 3 ? 1 : 0);
export const media = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
export const fmt = (v) => (v == null ? "—" : v.toFixed(2).replace(".", ","));

/**
 * Consolida avaliações por colaborador.
 * Entrada: [{ tipo, avaliadoId, avaliadoNome, extra, notas: number[20] }]
 * Pesos: Gestor 50% · Pares 30% · Auto 20%. Se faltar uma fonte, os pesos
 * restantes são redistribuídos proporcionalmente.
 */
export function consolidar(avaliacoes) {
  const grupos = {};
  avaliacoes.forEach((a) => {
    const g = (grupos[a.avaliadoId] ||= { nome: a.avaliadoNome, extra: a.extra, auto: [], par: [], gestor: [] });
    g[a.tipo].push(a);
  });

  return Object.entries(grupos)
    .map(([id, g]) => {
      const fonte = {};
      Object.keys(TIPOS).forEach((t) => {
        const ys = g[t].map((a) => media(a.notas.slice(0, 10)));
        const xs = g[t].map((a) => media(a.notas.slice(10, 20)));
        fonte[t] = ys.length ? { y: media(ys), x: media(xs), n: ys.length, geral: (media(ys) + media(xs)) / 2 } : null;
      });
      const disp = Object.keys(TIPOS).filter((t) => fonte[t]);
      const soma = disp.reduce((s, t) => s + TIPOS[t].peso, 0);
      const yFinal = disp.reduce((s, t) => s + fonte[t].y * TIPOS[t].peso, 0) / soma;
      const xFinal = disp.reduce((s, t) => s + fonte[t].x * TIPOS[t].peso, 0) / soma;
      const chave = `${faixa(yFinal)}-${faixa(xFinal)}`;
      const pontoCego = Boolean(fonte.auto && fonte.gestor && fonte.auto.geral - fonte.gestor.geral > 1.0);
      return {
        id, nome: g.nome, extra: g.extra, fonte, yFinal, xFinal, chave,
        quadrante: QUAD[chave], pontoCego, completo: disp.length === 3,
        total: g.auto.length + g.par.length + g.gestor.length,
      };
    })
    .sort((a, b) => b.yFinal + b.xFinal - (a.yFinal + a.xFinal));
}
