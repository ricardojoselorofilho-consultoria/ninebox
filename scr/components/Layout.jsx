import { NavLink, Outlet } from "react-router-dom";
import { LayoutGrid, Link2, Users, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Marca } from "./ui";

export default function Layout() {
  const { isRH, nome, email, sair } = useAuth();
  const itens = [
    { to: "/painel", label: "Dashboard Nine Box", icon: LayoutGrid },
    { to: "/convites", label: "Convites e links", icon: Link2 },
    { to: "/colaboradores", label: isRH ? "Colaboradores" : "Minha equipe", icon: Users },
    ...(isRH ? [{ to: "/usuarios", label: "Usuários do painel", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-verde text-white lg:sticky lg:top-0 lg:h-screen flex flex-col">
        <div className="px-4 lg:px-5 py-4 lg:py-6 flex items-center justify-between gap-3">
          <div className="bg-white rounded-lg px-2.5 py-2"><Marca compacta /></div>
          <button onClick={sair} className="lg:hidden text-white/80 hover:text-white flex items-center gap-1.5 text-sm">
            <LogOut size={16} /> Sair
          </button>
        </div>
        <nav className="flex lg:flex-col gap-1 px-3 pb-3 overflow-x-auto">
          {itens.map(({ to, label, icon: Ic }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap ${isActive ? "bg-white/10 text-white shadow-[inset_3px_0_0_#c0934f]" : "text-white/75 hover:text-white hover:bg-white/5"}`}>
              <Ic size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block mt-auto px-5 py-5 border-t border-white/10">
          <p className="text-sm font-semibold truncate">{nome || email}</p>
          <p className="text-xs text-white/60 truncate">{email}</p>
          <p className="mt-2 inline-block text-[10px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded bg-ouro text-white">
            {isRH ? "RH · acesso total" : "Gestor · sua equipe"}
          </p>
          <button onClick={sair} className="mt-4 flex items-center gap-2 text-sm text-white/75 hover:text-white">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      <main className="px-4 sm:px-6 lg:px-10 py-8 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
