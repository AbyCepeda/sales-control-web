import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/auth.slice";
import { api } from "../../services/api";
import { AppButton } from "../ui/AppButton";

type AppLayoutProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  path: string;
  roles?: Array<"ADMIN" | "SELLER">;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Pedidos",
    path: "/orders",
  },
  {
    label: "Productos",
    path: "/products",
  },
  {
    label: "Clientes",
    path: "/customers",
  },
  {
    label: "Usuarios",
    path: "/users",
    roles: ["ADMIN"],
  },
];

function getNavLinkClassName({ isActive }: { isActive: boolean }) {
  return `block rounded-2xl px-4 py-3 text-sm font-bold transition ${
    isActive
      ? "bg-slate-950 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  }`;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const visibleNavigationItems = navigationItems.filter((item) => {
    if (!item.roles) {
      return true;
    }

    return user?.role ? item.roles.includes(user.role) : false;
  });

  function handleLogout() {
    dispatch(api.util.resetApiState());
    dispatch(logout());
    navigate("/login", { replace: true });
  }

  function handleCloseMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
            Sales Control
          </p>

          <h1 className="mt-2 text-2xl font-extrabold text-slate-950">
            Panel Web
          </h1>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-100 p-4">
          <p className="text-sm font-extrabold text-slate-950">
            {user?.name ?? "Usuario"}
          </p>

          <p className="mt-1 text-xs text-slate-500">{user?.email}</p>

          <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
            {user?.role}
          </span>
        </div>

        <nav className="mt-8 space-y-2">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={getNavLinkClassName}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5">
          <AppButton variant="danger" className="w-full" onClick={handleLogout}>
            Cerrar sesión
          </AppButton>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Sales Control
            </p>

            <h1 className="text-lg font-extrabold text-slate-950">
              Panel Web
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950"
          >
            {isMobileMenuOpen ? "Cerrar" : "Menú"}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm font-extrabold text-slate-950">
                {user?.name ?? "Usuario"}
              </p>

              <p className="mt-1 text-xs text-slate-500">{user?.email}</p>

              <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                {user?.role}
              </span>
            </div>

            <nav className="mt-4 space-y-2">
              {visibleNavigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={getNavLinkClassName}
                  onClick={handleCloseMobileMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <AppButton
              variant="danger"
              className="mt-4 w-full"
              onClick={handleLogout}
            >
              Cerrar sesión
            </AppButton>
          </div>
        ) : null}
      </header>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}