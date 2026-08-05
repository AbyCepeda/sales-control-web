import { AppLayout } from "../components/layout/AppLayout";

export function CustomersPage() {
  return (
    <AppLayout>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
        Clientes
      </p>

      <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
        Clientes
      </h2>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <p className="font-bold text-slate-950">
          Aquí construiremos la lista de clientes.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Tendrá búsqueda, detalle e historial.
        </p>
      </div>
    </AppLayout>
  );
}