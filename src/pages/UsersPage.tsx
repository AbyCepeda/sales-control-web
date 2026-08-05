import { AppLayout } from "../components/layout/AppLayout";

export function UsersPage() {
  return (
    <AppLayout>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
        Usuarios
      </p>

      <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
        Usuarios
      </h2>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <p className="font-bold text-slate-950">
          Aquí construiremos la gestión de usuarios.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Esta pantalla será visible solo para ADMIN.
        </p>
      </div>
    </AppLayout>
  );
}