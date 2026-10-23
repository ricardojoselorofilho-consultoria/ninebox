import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Lock, UserRound } from "lucide-react";
import { supabase, traduzErro } from "../lib/supabase";
import { TIPOS } from "../lib/ninebox";
import { Aviso, Carregando, Marca } from "../components/ui";
import FormularioAvaliacao from "../components/FormularioAvaliacao";

function Moldura({ children }) {
  return (
    <div className="min-h-screen">
      <header className="bg-papel border-b border-linha">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Marca compacta />
          <span className="text-xs text-suave flex items-center gap-1.5"><Lock size={13} /> Link pessoal e confidencial</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">{children}</main>
    </div>
  );
}

export default function Avaliar() {
  const { token } = useParams();
  const [convite, setConvite] = useState(undefined);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    supabase.rpc("obter_convite", { p_token: token }).then(({ data, error }) => {
      if (error) { setErro(traduzErro(error)); setConvite(null); return; }
      setConvite(data?.[0] || null);
    });
  }, [token]);

  const enviar = async (notas) => {
    setEnviando(true); setErro(null);
    const { error } = await supabase.rpc("enviar_avaliacao", { p_token: token, p_notas: notas });
    setEnviando(false);
    if (error) { setErro(traduzErro(error)); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setConcluido(true);
    window.scrollTo({ top: 0 });
  };

  if (convite === undefined) return <Moldura><Carregando /></Moldura>;

  if (!convite)
    return (
      <Moldura>
        <div className="cartao p-8 text-center max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-bold text-verde">Link não encontrado</h1>
          <p className="text-sm text-suave mt-2">Confira se o link foi copiado inteiro. Se o problema continuar, peça um novo link ao RH ou ao seu gestor.</p>
          {erro && <div className="mt-4 text-left"><Aviso>{erro}</Aviso></div>}
        </div>
      </Moldura>
    );

  const auto = convite.tipo === "auto";

  if (concluido || convite.status === "respondido")
    return (
      <Moldura>
        <div className="cartao p-8 text-center max-w-lg mx-auto flex flex-col items-center gap-3">
          <CheckCircle2 size={44} className="text-verde" />
          <h1 className="font-display text-2xl font-bold text-verde">{concluido ? "Avaliação enviada. Obrigado!" : "Esta avaliação já foi respondida"}</h1>
          <p className="text-sm text-suave">
            {auto ? "Sua autoavaliação" : `A avaliação de ${convite.avaliado}`} foi registrada no {convite.ciclo}. Você já pode fechar esta página.
          </p>
        </div>
      </Moldura>
    );

  if (!convite.ciclo_aberto)
    return (
      <Moldura>
        <div className="cartao p-8 text-center max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-bold text-verde">Ciclo encerrado</h1>
          <p className="text-sm text-suave mt-2">O {convite.ciclo} não está mais recebendo respostas. Fale com o RH se precisar reabrir.</p>
        </div>
      </Moldura>
    );

  return (
    <Moldura>
      <div className="flex flex-col gap-6">
        <section className="cartao p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-verde-50 text-verde grid place-items-center shrink-0"><UserRound size={26} /></div>
          <div className="flex-1 min-w-0">
            <p className="rotulo text-ouro-600">{convite.ciclo} · {TIPOS[convite.tipo].label}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-verde mt-1 leading-tight">
              {auto ? `Sua autoavaliação, ${convite.avaliador.split(" ")[0]}` : `Avaliação de ${convite.avaliado}`}
            </h1>
            <p className="text-sm text-suave mt-1.5">
              {auto
                ? "Responda com sinceridade pensando nos últimos 6 meses. Cada afirmação descreve você."
                : `Olá, ${convite.avaliador.split(" ")[0]}. Cada afirmação descreve ${convite.avaliado}. Pense nos últimos 6 meses de convivência de trabalho.`}
            </p>
          </div>
        </section>
        {!auto && (
          <p className="text-xs text-suave -mt-2 flex items-center gap-1.5"><Lock size={13} />Suas respostas individuais não são mostradas a {convite.avaliado}. RH e gestão veem apenas o resultado consolidado.</p>
        )}
        {erro && <Aviso>{erro}</Aviso>}
        <FormularioAvaliacao onEnviar={enviar} enviando={enviando} />
      </div>
    </Moldura>
  );
}
