import { useNavigate } from "react-router-dom";
import { AppButton } from "../components/ui/AppButton";
import { logout } from "../features/auth/auth.slice";
import type {
  DashboardRecentOrder,
  OrderStatus,
} from "../features/dashboard/dashboard.types";
import { api } from "../services/api";
import { useGetDashboardQuery } from "../services/dashboardApi";
import { useAppDispatch, useAppSelector } from "../app/hooks";

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);

  return `$${amount.toFixed(2)}`;
}

function getStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

function MetricCard({
  title,
  value,
  description,
  variant = "default",
}: {
  title: string;
  value: string;
  description?: string;
  variant?: "default" | "dark" | "success" | "warning" | "danger";
}) {
  const variantClassName = {
    default: "bg-white border border-slate-200",
    dark: "bg-slate-950",
    success: "bg-emerald-50 border border-emerald-200",
    warning: "bg-orange-50 border border-orange-200",
    danger: "bg-red-50 border border-red-200",
  }[variant];

  const titleClassName = variant === "dark" ? "text-slate-400" : "text-slate-500";

  const valueClassName =
    variant === "dark"
      ? "text-white"
      : variant === "success"
        ? "text-emerald-700"
        : variant === "warning"
          ? "text-orange-600"
          : variant === "danger"
            ? "text-red-600"
            : "text-slate-950";

  const descriptionClassName =
    variant === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <article className={`rounded-3xl p-5 shadow-sm ${variantClassName}`}>
      <p className={`text-sm font-semibold ${titleClassName}`}>{title}</p>

      <p className={`mt-2 text-3xl font-extrabold ${valueClassName}`}>
        {value}
      </p>

      {description ? (
        <p className={`mt-2 text-xs ${descriptionClassName}`}>{description}</p>
      ) : null}
    </article>
  );
}

function RecentOrderCard({ order }: { order: DashboardRecentOrder }) {
  const customerNames = order.customerOrders
    .map((customerOrder) => customerOrder.customer.name)
    .join(", ");

  const paidAmount = order.customerOrders.reduce((orderTotal, customerOrder) => {
    const customerPaid = customerOrder.payments.reduce((paymentTotal, payment) => {
      return paymentTotal + Number(payment.amount);
    }, 0);

    return orderTotal + customerPaid;
  }, 0);

  const pendingAmount = Math.max(Number(order.total) - paidAmount, 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">Pedido #{order.id}</p>

          <h3 className="mt-1 text-lg font-extrabold text-slate-950">
            {customerNames || "Sin cliente"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Vendedor: {order.seller.name}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-extrabold text-slate-950">
            {formatMoney(order.total)}
          </p>

          <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase text-emerald-700">
            Pagado
          </p>
          <p className="mt-1 text-xl font-extrabold text-emerald-700">
            {formatMoney(paidAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-4">
          <p className="text-xs font-bold uppercase text-orange-700">
            Pendiente
          </p>
          <p className="mt-1 text-xl font-extrabold text-orange-600">
            {formatMoney(pendingAmount)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const {
    data: dashboardResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetDashboardQuery();

  const dashboard = dashboardResponse?.data;

  function handleLogout() {
    dispatch(api.util.resetApiState());
    dispatch(logout());
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Sales Control Web
            </h1>

            <p className="text-sm text-slate-500">
              Bienvenido, {user?.name ?? "usuario"} · Rol: {user?.role}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AppButton variant="outline" onClick={() => refetch()}>
              {isFetching ? "Actualizando..." : "Actualizar"}
            </AppButton>

            <AppButton variant="danger" onClick={handleLogout}>
              Salir
            </AppButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {isLoading ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-slate-950">Cargando dashboard...</p>
            <p className="mt-2 text-sm text-slate-500">
              Estamos consultando la API.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-red-600">
              No se pudo cargar el dashboard
            </h2>

            <p className="mt-2 text-slate-500">
              Revisa que tu sesión sea válida y que la API esté respondiendo.
            </p>

            <AppButton className="mt-5" onClick={() => refetch()}>
              Reintentar
            </AppButton>
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <MetricCard
                  title="Total vendido"
                  value={formatMoney(dashboard?.totalRevenue)}
                  description="No incluye pedidos cancelados"
                  variant="dark"
                />
              </div>

              <MetricCard
                title="Total pagado"
                value={formatMoney(dashboard?.totalPaid)}
                description="Abonos registrados"
                variant="success"
              />

              <MetricCard
                title="Pendiente"
                value={formatMoney(dashboard?.totalPending)}
                description="Por cobrar"
                variant="warning"
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Pagos de hoy"
                value={formatMoney(dashboard?.todayPayments)}
              />

              <MetricCard
                title="Pedidos"
                value={`${dashboard?.totalOrders ?? 0}`}
              />

              <MetricCard
                title="Clientes activos"
                value={`${dashboard?.activeCustomers ?? 0}`}
              />

              <MetricCard
                title="Productos activos"
                value={`${dashboard?.activeProducts ?? 0}`}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-4">
              <MetricCard
                title="Pendientes"
                value={`${dashboard?.pendingOrders ?? 0}`}
                variant="warning"
              />

              <MetricCard
                title="Pagados"
                value={`${dashboard?.paidOrders ?? 0}`}
                variant="success"
              />

              <MetricCard
                title="Entregados"
                value={`${dashboard?.deliveredOrders ?? 0}`}
              />

              <MetricCard
                title="Cancelados"
                value={`${dashboard?.cancelledOrders ?? 0}`}
                variant="danger"
              />
            </div>

            <section className="mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950">
                    Pedidos recientes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Últimos pedidos registrados según el rol del usuario.
                  </p>
                </div>
              </div>

              {dashboard?.recentOrders?.length ? (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {dashboard.recentOrders.map((order) => (
                    <RecentOrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-3xl bg-white p-8 text-center shadow-sm">
                  <p className="font-bold text-slate-950">
                    Todavía no hay pedidos recientes.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Cuando registres pedidos aparecerán aquí.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}