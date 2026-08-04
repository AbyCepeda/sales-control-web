import { AppButton } from "../components/ui/AppButton";
import { logout } from "../features/auth/auth.slice";
import { api } from "../services/api";
import { useAppDispatch, useAppSelector } from "../app/hooks";

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  function handleLogout() {
    dispatch(api.util.resetApiState());
    dispatch(logout());
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Sales Control Web
            </h1>
            <p className="text-sm text-slate-500">
              Bienvenido, {user?.name ?? "usuario"} · Rol: {user?.role}
            </p>
          </div>

          <AppButton variant="danger" onClick={handleLogout}>
            Salir
          </AppButton>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Primer checkpoint
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-slate-950">
            Login web conectado correctamente
          </h2>

          <p className="mt-3 text-slate-500">
            Ya estamos usando el mismo backend, la misma base de datos Neon y el
            mismo JWT que usa tu app móvil.
          </p>
        </div>
      </section>
    </main>
  );
}