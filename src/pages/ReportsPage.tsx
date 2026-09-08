import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AppButton } from "../components/ui/AppButton";
import type { Order, OrderStatus } from "../features/orders/order.types";
import { useGetCustomersQuery } from "../services/customersApi";
import { useGetOrdersQuery } from "../services/ordersApi";
import { useGetProductsQuery } from "../services/productsApi";

type ReportMetricCardProps = {
  title: string;
  value: string;
  description: string;
  variant?: "default" | "dark" | "success" | "warning" | "danger";
};

type ProductSummary = {
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
};

type CustomerDebtSummary = {
  orderId: number;
  customerId: number;
  customerName: string;
  phone: string;
  total: number;
  paid: number;
  pending: number;
};

type RecentPaymentSummary = {
  id: number;
  orderId: number;
  customerName: string;
  amount: number;
  method: string;
  createdAt: string;
};

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function getPaymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    CARD: "Tarjeta",
    OTHER: "Otro",
  };

  return labels[method] ?? method;
}

function getOrderPaidAmount(order: Order) {
  return order.customerOrders.reduce((orderTotal, customerOrder) => {
    const customerPaid = customerOrder.payments.reduce((paymentTotal, payment) => {
      return paymentTotal + Number(payment.amount);
    }, 0);

    return orderTotal + customerPaid;
  }, 0);
}

function getOrderPendingAmount(order: Order) {
  return Math.max(Number(order.total) - getOrderPaidAmount(order), 0);
}

function ReportMetricCard({
  title,
  value,
  description,
  variant = "default",
}: ReportMetricCardProps) {
  const variantClassName = {
    default: "border border-slate-200 bg-white",
    dark: "bg-slate-950",
    success: "border border-emerald-200 bg-emerald-50",
    warning: "border border-yellow-200 bg-yellow-50",
    danger: "border border-red-200 bg-red-50",
  }[variant];

  const titleClassName =
    variant === "dark" ? "text-slate-400" : "text-slate-500";

  const valueClassName =
    variant === "dark"
      ? "text-white"
      : variant === "success"
        ? "text-emerald-700"
        : variant === "warning"
          ? "text-yellow-700"
          : variant === "danger"
            ? "text-red-600"
            : "text-slate-950";

  return (
    <article className={`rounded-3xl p-5 shadow-sm ${variantClassName}`}>
      <p className={`text-sm font-semibold ${titleClassName}`}>{title}</p>

      <p className={`mt-2 text-3xl font-extrabold ${valueClassName}`}>
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

export function ReportsPage() {
  const {
    data: ordersResponse,
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useGetOrdersQuery();

  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetProductsQuery();

  const {
    data: customersResponse,
    isLoading: isLoadingCustomers,
    error: customersError,
  } = useGetCustomersQuery();

  const orders = ordersResponse?.data ?? [];
  const products = productsResponse?.data ?? [];
  const customers = customersResponse?.data ?? [];

  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingCustomers;
  const hasError = ordersError || productsError || customersError;

  const reportData = useMemo(() => {
    const totalSold = orders.reduce((total, order) => {
      return total + Number(order.total);
    }, 0);

    const totalPaid = orders.reduce((total, order) => {
      return total + getOrderPaidAmount(order);
    }, 0);

    const totalPending = orders.reduce((total, order) => {
      return total + getOrderPendingAmount(order);
    }, 0);

    const pendingOrders = orders.filter((order) => {
      return getOrderPendingAmount(order) > 0;
    }).length;

    const deliveredOrders = orders.filter((order) => {
      return order.status === "DELIVERED";
    }).length;

    const cancelledOrders = orders.filter((order) => {
      return order.status === "CANCELLED";
    }).length;

    const productMap = new Map<string, ProductSummary>();

    const customersWithDebt: CustomerDebtSummary[] = [];
    const recentPayments: RecentPaymentSummary[] = [];

    for (const order of orders) {
      for (const customerOrder of order.customerOrders) {
        const paid = customerOrder.payments.reduce((total, payment) => {
          return total + Number(payment.amount);
        }, 0);

        const total = Number(customerOrder.total);
        const pending = Math.max(total - paid, 0);

        if (pending > 0) {
          customersWithDebt.push({
            orderId: order.id,
            customerId: customerOrder.customer.id,
            customerName: customerOrder.customer.name,
            phone: customerOrder.customer.phone ?? "Sin teléfono",
            total,
            paid,
            pending,
          });
        }

        for (const payment of customerOrder.payments) {
          recentPayments.push({
            id: payment.id,
            orderId: order.id,
            customerName: customerOrder.customer.name,
            amount: Number(payment.amount),
            method: payment.method,
            createdAt: payment.createdAt,
          });
        }

        for (const item of customerOrder.items) {
          const current = productMap.get(item.skuSnapshot);

          if (current) {
            productMap.set(item.skuSnapshot, {
              ...current,
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + Number(item.subtotal),
            });
          } else {
            productMap.set(item.skuSnapshot, {
              sku: item.skuSnapshot,
              name: item.nameSnapshot,
              quantity: item.quantity,
              revenue: Number(item.subtotal),
            });
          }
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topCustomersWithDebt = customersWithDebt
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 5);

    const latestPayments = recentPayments
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);

    const recentOrders = [...orders]
      .sort((a, b) => {
        return (
          new Date(b.purchaseDate).getTime() -
          new Date(a.purchaseDate).getTime()
        );
      })
      .slice(0, 5);

    return {
      totalSold,
      totalPaid,
      totalPending,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      activeProducts: products.filter((product) => product.isActive).length,
      activeCustomers: customers.filter((customer) => customer.isActive).length,
      topProducts,
      topCustomersWithDebt,
      latestPayments,
      recentOrders,
    };
  }, [orders, products, customers]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-950">
            Reportes
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Resumen general de ventas, cobros, pendientes y actividad reciente.
          </p>
        </div>

        <AppButton variant="outline" onClick={() => refetchOrders()}>
          {isFetchingOrders ? "Actualizando..." : "Actualizar"}
        </AppButton>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Cargando reportes...</p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos calculando la información con tus pedidos actuales.
          </p>
        </div>
      ) : hasError ? (
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-extrabold text-red-600">
            No se pudieron cargar los reportes
          </h3>

          <p className="mt-2 text-slate-500">
            Revisa que tu sesión esté activa y que la API esté respondiendo.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportMetricCard
              title="Total vendido"
              value={formatMoney(reportData.totalSold)}
              description="Suma total de todos los pedidos registrados."
              variant="dark"
            />

            <ReportMetricCard
              title="Total cobrado"
              value={formatMoney(reportData.totalPaid)}
              description="Suma de todos los abonos registrados."
              variant="success"
            />

            <ReportMetricCard
              title="Total pendiente"
              value={formatMoney(reportData.totalPending)}
              description="Dinero que todavía falta por cobrar."
              variant="warning"
            />

            <ReportMetricCard
              title="Pedidos con saldo"
              value={String(reportData.pendingOrders)}
              description="Pedidos que aún tienen monto pendiente."
              variant="danger"
            />
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportMetricCard
              title="Pedidos entregados"
              value={String(reportData.deliveredOrders)}
              description="Pedidos marcados como entregados."
            />

            <ReportMetricCard
              title="Pedidos cancelados"
              value={String(reportData.cancelledOrders)}
              description="Pedidos marcados como cancelados."
            />

            <ReportMetricCard
              title="Productos activos"
              value={String(reportData.activeProducts)}
              description="Productos disponibles en el catálogo."
            />

            <ReportMetricCard
              title="Clientes activos"
              value={String(reportData.activeCustomers)}
              description="Clientes activos registrados."
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">
                  Productos más vendidos
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Ranking por cantidad vendida.
                </p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                        Producto
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                        Cantidad
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                        Vendido
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {reportData.topProducts.length ? (
                      reportData.topProducts.map((product) => (
                        <tr key={product.sku}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-950">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              SKU {product.sku}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-slate-700">
                            {product.quantity}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-extrabold text-slate-950">
                            {formatMoney(product.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm font-bold text-slate-500"
                        >
                          Todavía no hay productos vendidos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">
                  Clientes con saldo pendiente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Clientes ordenados por mayor adeudo.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {reportData.topCustomersWithDebt.length ? (
                  reportData.topCustomersWithDebt.map((customerDebt) => (
                    <Link
                      key={`${customerDebt.orderId}-${customerDebt.customerId}`}
                      to={`/orders/${customerDebt.orderId}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-extrabold text-slate-950">
                            {customerDebt.customerName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Pedido #{customerDebt.orderId} ·{" "}
                            {customerDebt.phone}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Pendiente
                          </p>

                          <p className="font-extrabold text-yellow-700">
                            {formatMoney(customerDebt.pending)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="font-bold text-slate-700">
                      No hay clientes con saldo pendiente.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">
                  Últimos pagos
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Abonos registrados recientemente.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {reportData.latestPayments.length ? (
                  reportData.latestPayments.map((payment) => (
                    <Link
                      key={payment.id}
                      to={`/orders/${payment.orderId}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-extrabold text-slate-950">
                            {payment.customerName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Pedido #{payment.orderId} ·{" "}
                            {getPaymentMethodLabel(payment.method)} ·{" "}
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>

                        <p className="font-extrabold text-emerald-700">
                          {formatMoney(payment.amount)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="font-bold text-slate-700">
                      Todavía no hay pagos registrados.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">
                  Pedidos recientes
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Últimos pedidos registrados en el sistema.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {reportData.recentOrders.length ? (
                  reportData.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-extrabold text-slate-950">
                            Pedido #{order.id}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {order.seller.name} · {formatDate(order.purchaseDate)}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            {getStatusLabel(order.status)}
                          </p>

                          <p className="font-extrabold text-slate-950">
                            {formatMoney(Number(order.total))}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="font-bold text-slate-700">
                      Todavía no hay pedidos registrados.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </AppLayout>
  );
}