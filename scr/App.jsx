import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { configurado } from "./lib/supabase";
import Layout from "./components/Layout";
import { Carregando, Marca } from "./components/ui";
import Login from "./pages/Login";
import RedefinirSenha from "./pages/RedefinirSenha";
import Avaliar from "./pages/Avaliar";
import Dashboard from "./pages/Dashboard";
import Convites from "./pages/Convites";
import Colaboradores from "./pages/Colaboradores";
import Usuarios from "./pages/Usuarios";

function Protegido({ children, soRH = false }) {
  const { sessao, papel, isRH, sair, email } = useAuth();
  if (sessao === undefined || (sessao && papel === undefined)) return <Carregando />;
  if (!sessao) return <Navigate to="/login" replace />;
  if (!papel)
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="cartao p-8 max-w-md text-center flex flex-col items-center gap-4">
          <Marca />
          <h1 className="font-display text-2xl font-bold text-verde">Acesso não liberado</h1>
          <p className="text-sm text-suave">O e-mail <strong>{email}</strong> entrou, mas não tem permissão de RH ou Gestor. Peça ao RH para cadastrá-lo em Usuários do painel.</p>
          <button className="btn-linha" onClick={sair}>Sair</button>
        </div>
      </div>
    );
  if (soRH && !isRH) return <Navigate to="/painel" replace />;
  return children;
}

export default function App() {
  if (!configurado)
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="cartao p-8 max-w-lg flex flex-col gap-3">
          <Marca />
          <h1 className="font-display text-2xl font-bold text-verde mt-2">Falta conectar ao Supabase</h1>
          <p className="text-sm text-suave">Cadastre as variáveis <code className="num">VITE_SUPABASE_URL</code> e <code className="num">VITE_SUPABASE_ANON_KEY</code> (na Vercel: Settings › Environment Variables) e publique novamente. O passo a passo está no README.</p>
        </div>
      </div>
    );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/avaliar/:token" element={<Avaliar />} />
      <Route element={<Protegido><Layout /></Protegido>}>
        <Route path="/painel" element={<Dashboard />} />
        <Route path="/convites" element={<Convites />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/usuarios" element={<Protegido soRH><Usuarios /></Protegido>} />
      </Route>
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  );
}
