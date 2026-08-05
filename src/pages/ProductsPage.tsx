import { AppLayout } from "../components/layout/AppLayout";

export function ProductsPage() {
  return (
    <AppLayout>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
        Productos
      </p>

      <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
        Productos
      </h2>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <p className="font-bold text-slate-950">
          Aquí construiremos el catálogo de productos.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          En móvil se verá como tarjetas; en desktop como tabla.
        </p>
      </div>
    </AppLayout>
  );
}