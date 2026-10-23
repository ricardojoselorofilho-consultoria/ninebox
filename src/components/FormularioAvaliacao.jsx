import { useState } from "react";
import { Send } from "lucide-react";
import { PERGUNTAS, LIKERT } from "../lib/ninebox";

const EIXOS = [
  { eixo: "Y", titulo: "Performance e Desempenho", inicio: 0, cor: "#0b3d2c" },
  { eixo: "X", titulo: "Cultura e Valores", inicio: 10, cor: "#a87a36" },
];

export default function FormularioAvaliacao({ onEnviar, enviando, sujeito }) {
  const [notas, setNotas] = useState(Array(20).fill(0));
  const [tentou, setTentou] = useState(false);
  const feitas = notas.filter(Boolean).length;

  const marcar = (i, v) => setNotas((n) => { const c = [...n]; c[i] = v; return c; });

  const submit = (e) => {
    e.preventDefault();
    setTentou(true);
    if (feitas < 20) {
      const primeira = notas.findIndex((v) => !v);
      document.getElementById(`q${primeira}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onEnviar(notas);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-suave">
        <span className="font-semibold text-tinta">Escala:</span>
        {LIKERT.map((l, i) => <span key={i}><span className="num font-semibold text-tinta">{i + 1}</span> = {l}</span>)}
      </div>

      {EIXOS.map(({ eixo, titulo, inicio, cor }) => {
        const parte = notas.slice(inicio, inicio + 10);
        return (
          <section key={eixo} className="cartao overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-linha">
              <div className="flex items-center gap-3">
                <span className="num text-xs font-semibold px-2 py-1 rounded-md text-white" style={{ background: cor }}>EIXO {eixo}</span>
                <h2 className="font-bold">{titulo}</h2>
              </div>
              <span className="text-xs text-suave num">{parte.filter(Boolean).length}/10</span>
            </div>
            <ol className="divide-y divide-linha">
              {parte.map((v, k) => {
                const i = inicio + k;
                const falta = tentou && !v;
                return (
                  <li key={i} id={`q${i}`} className={`px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 ${falta ? "bg-alerta-50" : ""}`}>
                    <div className="flex gap-3 flex-1 min-w-0">
                      <span className="num text-sm text-suave w-6 shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{PERGUNTAS[i][0]}</p>
                        <p className="text-sm text-suave leading-relaxed">{sujeito ? `${sujeito}: ` : ""}{PERGUNTAS[i][1]}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 pl-9 lg:pl-0" role="radiogroup" aria-label={PERGUNTAS[i][0]}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button type="button" key={n} role="radio" aria-checked={v === n} title={LIKERT[n - 1]}
                          onClick={() => marcar(i, n)}
                          className="num w-11 h-10 rounded-lg border text-sm font-semibold transition-colors"
                          style={v === n ? { background: cor, borderColor: cor, color: "#fff" } : { background: "#fff", borderColor: "#e2e1d8", color: "#5f6b64" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <div className="sticky bottom-3 z-10 cartao p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold">Progresso</span><span className="num text-suave">{feitas}/20</span>
          </div>
          <div className="h-2 rounded-full bg-cinza-50 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${feitas * 5}%`, background: feitas === 20 ? "#0b3d2c" : "#c0934f" }} />
          </div>
          {tentou && feitas < 20 && <p className="text-xs mt-2 text-alerta">Faltam {20 - feitas} pergunta(s). Elas estão destacadas em vermelho.</p>}
        </div>
        <button type="submit" disabled={enviando} className="btn-verde h-11 px-6">
          <Send size={16} /> {enviando ? "Enviando…" : "Enviar Avaliação"}
        </button>
      </div>
    </form>
  );
}
