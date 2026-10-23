import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

const CHAVE = "rdf-ciclo-selecionado";

/** Lista de ciclos + ciclo selecionado (lembrado neste navegador) */
export function useCiclos() {
  const [ciclos, setCiclos] = useState(undefined);
  const [cicloId, setCicloIdState] = useState(() => {
    try { return localStorage.getItem(CHAVE) || ""; } catch { return ""; }
  });

  const setCicloId = (id) => {
    setCicloIdState(id);
    try { localStorage.setItem(CHAVE, id); } catch { /* sem armazenamento */ }
  };

  const recarregar = useCallback(async () => {
    const { data } = await supabase.from("ciclos").select("*").order("created_at", { ascending: false });
    setCiclos(data || []);
    return data || [];
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  useEffect(() => {
    if (ciclos && ciclos.length && !ciclos.some((c) => c.id === cicloId)) setCicloId(ciclos[0].id);
  }, [ciclos, cicloId]);

  return { ciclos, cicloId, setCicloId, ciclo: ciclos?.find((c) => c.id === cicloId), recarregar };
}