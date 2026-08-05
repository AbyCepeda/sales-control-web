import { AppLayout } from "../components/layout/AppLayout";

export function OrdersPage() {
  return (
    <AppLayout>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
        Pedidos
      </p>

      <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
        Pedidos
      </h2>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <p className="font-bold text-slate-950">
          Aquí construiremos la lista de pedidos.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Será responsiva: tabla en desktop y cards en mobile.
        </p>
      </div>
    </AppLayout>
  );
}