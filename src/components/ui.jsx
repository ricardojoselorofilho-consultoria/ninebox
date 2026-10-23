import { useState } from "react";
import { Check, Copy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function Marca({ compacta = false, clara = false }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <img src="/logo-simbolo.png" alt="" className={compacta ? "w-9 h-9" : "w-11 h-11"} />
      <div className="leading-none min-w-0">
        <div className={`font-display font-bold tracking-wide ${compacta ? "text-xl" : "text-2xl"} ${clara ? "text-white" : "text-verde"}`}>RDF</div>
        <div className={`text-[10px] font-semibold tracking-[0.32em] mt-1 ${clara ? "text-white/80" : "text-verde"}`}>CONSULTORIA</div>
      </div>
    </div>
  );
}

export function Carregando({ texto = "Carregando…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-suave text-sm">
      <Loader2 size={18} className="animate-spin" /> {texto}
    </div>
  );
}

export function Aviso({ tipo = "erro", children }) {
  const erro = tipo === "erro";
  const Ic = erro ? AlertCircle : CheckCircle2;
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${erro ? "bg-alerta-50 text-alerta" : "bg-verde-50 text-verde"}`} role={erro ? "alert" : "status"}>
      <Ic size={17} className="mt-0.5 shrink-0" /> <div>{children}</div>
    </div>
  );
}

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = texto; document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export function BotaoCopiar({ texto, rotulo = "Copiar link", className = "btn-linha", icone = true }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={className}
      onClick={async () => { if (await copiarTexto(texto)) { setOk(true); setTimeout(() => setOk(false), 1800); } }}>
      {icone && (ok ? <Check size={15} /> : <Copy size={15} />)}
      {ok ? "Copiado" : rotulo}
    </button>
  );
}

export function Cabecalho({ rotulo, titulo, children, descricao }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {rotulo && <p className="rotulo">{rotulo}</p>}
        <h1 className="font-display text-[28px] font-bold text-verde mt-1 leading-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-suave mt-1.5 max-w-2xl">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function SeletorCiclo({ ciclos, cicloId, setCicloId }) {
  return (
    <label className="flex items-center gap-2">
      <span className="rotulo">Ciclo</span>
      <select id="ciclo" className="campo h-10 w-auto min-w-[200px]" value={cicloId} onChange={(e) => setCicloId(e.target.value)}>
        {(ciclos || []).map((c) => (
          <option key={c.id} value={c.id}>{c.nome}{c.status === "encerrado" ? " (encerrado)" : ""}</option>
        ))}
      </select>
    </label>
  );
}

export function Pill({ tom, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: tom.bg, color: tom.fg }}>
      {children}
    </span>
  );
}
