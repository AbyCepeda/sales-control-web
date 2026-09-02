import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AppButton } from "../components/ui/AppButton";
import { AppInput } from "../components/ui/AppInput";
import { Pagination } from "../components/ui/Pagination";
import type {
  CustomerOrder,
  Order,
  OrderStatus,
} from "../features/orders/order.types";
import { useGetOrdersQuery } from "../services/ordersApi";

const SUBTABLE_INITIAL_LIMIT = 5;

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);

  return `$${amount.toFixed(2)}`;
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

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
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

function getStatusClassName(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING: "bg-orange-50 text-orange-700",
    PAID: "bg-emerald-50 text-emerald-700",
    DELIVERED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-50 text-red-600",
  };

  return classes[status];
}

function getOrderPaidAmount(order: Order) {
  return order.customerOrders.reduce((orderTotal, customerOrder) => {
    const customerPaid = customerOrder.payments.reduce(
      (paymentTotal, payment) => {
        return paymentTotal + Number(payment.amount);
      },
      0,
    );

    return orderTotal + customerPaid;
  }, 0);
}

function getOrderPendingAmount(order: Order) {
  return Math.max(Number(order.total) - getOrderPaidAmount(order), 0);
}

function getCustomerPaidAmount(customerOrder: CustomerOrder) {
  return customerOrder.payments.reduce((total, payment) => {
    return total + Number(payment.amount);
  }, 0);
}

function ShowMoreButton({
  total,
  visibleCount,
  isExpanded,
  onToggle,
  label,
}: {
  total: number;
  visibleCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  if (total <= visibleCount) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-50"
    >
      {isExpanded
        ? `Ver menos ${label}`
        : `Ver más ${label} (${total - visibleCount} más)`}
    </button>
  );
}

function OrderMobileCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItemsByCustomer, setExpandedItemsByCustomer] = useState<
    Record<number, boolean>
  >({});
  const [expandedPaymentsByCustomer, setExpandedPaymentsByCustomer] = useState<
    Record<number, boolean>
  >({});

  const customerNames = order.customerOrders
    .map((customerOrder) => customerOrder.customer.name)
    .join(", ");

  const paidAmount = getOrderPaidAmount(order);
  const pendingAmount = getOrderPendingAmount(order);

  function toggleCustomerItems(customerOrderId: number) {
    setExpandedItemsByCustomer((current) => ({
      ...current,
      [customerOrderId]: !current[customerOrderId],
    }));
  }

  function toggleCustomerPayments(customerOrderId: number) {
    setExpandedPaymentsByCustomer((current) => ({
      ...current,
      [customerOrderId]: !current[customerOrderId],
    }));
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Pedido #{order.id}
          </p>

          <h3 className="mt-2 wrap-break-word text-lg font-extrabold text-slate-950">
            {customerNames || "Sin cliente"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Vendedor: {order.seller.name}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {formatDate(order.purchaseDate)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
            order.status,
          )}`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-100 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">Total</p>
          <p className="mt-1 text-base font-extrabold text-slate-950">
            {formatMoney(order.total)}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase text-emerald-700">Pagado</p>
          <p className="mt-1 text-base font-extrabold text-emerald-700">
            {formatMoney(paidAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-3">
          <p className="text-xs font-bold uppercase text-orange-700">
            Pendiente
          </p>
          <p className="mt-1 text-base font-extrabold text-orange-600">
            {formatMoney(pendingAmount)}
          </p>
        </div>
      </div>

      <AppButton
        variant="outline"
        className="mt-5 w-full"
        onClick={() => setIsExpanded((current) => !current)}
      >
        {isExpanded ? "Ocultar detalle rápido" : "Ver detalle rápido"}
      </AppButton>

      <Link
        to={`/orders/${order.id}`}
        className="mt-3 flex w-full justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        Abrir pantalla de detalle
      </Link>

      {isExpanded ? (
        <div className="mt-5 space-y-4">
          {order.customerOrders.map((customerOrder) => {
            const customerPaid = getCustomerPaidAmount(customerOrder);
            const customerPending = Math.max(
              Number(customerOrder.total) - customerPaid,
              0,
            );

            const areItemsExpanded =
              expandedItemsByCustomer[customerOrder.id] ?? false;

            const arePaymentsExpanded =
              expandedPaymentsByCustomer[customerOrder.id] ?? false;

            const visibleItems = areItemsExpanded
              ? customerOrder.items
              : customerOrder.items.slice(0, SUBTABLE_INITIAL_LIMIT);

            const visiblePayments = arePaymentsExpanded
              ? customerOrder.payments
              : customerOrder.payments.slice(0, SUBTABLE_INITIAL_LIMIT);

            return (
              <div
                key={customerOrder.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="font-extrabold text-slate-950">
                  {customerOrder.customer.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Tel: {customerOrder.customer.phone ?? "Sin teléfono"}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Total</p>
                    <p className="font-extrabold text-slate-950">
                      {formatMoney(customerOrder.total)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500">Pagado</p>
                    <p className="font-extrabold text-emerald-700">
                      {formatMoney(customerPaid)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      Pendiente
                    </p>
                    <p className="font-extrabold text-orange-600">
                      {formatMoney(customerPending)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-3">
                  <p className="text-sm font-extrabold text-slate-950">
                    Artículos ({customerOrder.items.length})
                  </p>

                  <div className="mt-3 space-y-2">
                    {visibleItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-100 p-3 text-sm"
                      >
                        <p className="font-bold text-slate-950">
                          {item.nameSnapshot}
                        </p>

                        <p className="mt-1 text-slate-500">
                          SKU {item.skuSnapshot} · Cantidad {item.quantity} ·{" "}
                          {formatMoney(item.unitPriceSnapshot)}
                        </p>

                        <p className="mt-1 font-bold text-slate-950">
                          Subtotal: {formatMoney(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <ShowMoreButton
                    total={customerOrder.items.length}
                    visibleCount={SUBTABLE_INITIAL_LIMIT}
                    isExpanded={areItemsExpanded}
                    onToggle={() => toggleCustomerItems(customerOrder.id)}
                    label="artículos"
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-white p-3">
                  <p className="text-sm font-extrabold text-slate-950">
                    Abonos ({customerOrder.payments.length})
                  </p>

                  {visiblePayments.length ? (
                    <div className="mt-3 space-y-2">
                      {visiblePayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-xl border border-slate-100 p-3"
                        >
                          <p className="font-extrabold text-emerald-700">
                            {formatMoney(payment.amount)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {payment.method} · {formatDate(payment.createdAt)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {payment.notes ?? "Sin notas"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      Este cliente todavía no tiene abonos registrados.
                    </p>
                  )}

                  <ShowMoreButton
                    total={customerOrder.payments.length}
                    visibleCount={SUBTABLE_INITIAL_LIMIT}
                    isExpanded={arePaymentsExpanded}
                    onToggle={() => toggleCustomerPayments(customerOrder.id)}
                    label="abonos"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function OrderExpandedRow({ order }: { order: Order }) {
  const [expandedItemsByCustomer, setExpandedItemsByCustomer] = useState<
    Record<number, boolean>
  >({});
  const [expandedPaymentsByCustomer, setExpandedPaymentsByCustomer] = useState<
    Record<number, boolean>
  >({});

  function toggleCustomerItems(customerOrderId: number) {
    setExpandedItemsByCustomer((current) => ({
      ...current,
      [customerOrderId]: !current[customerOrderId],
    }));
  }

  function toggleCustomerPayments(customerOrderId: number) {
    setExpandedPaymentsByCustomer((current) => ({
      ...current,
      [customerOrderId]: !current[customerOrderId],
    }));
  }

  return (
    <tr>
      <td colSpan={9} className="bg-slate-50 px-6 py-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-extrabold text-slate-950">
            Detalle rápido del pedido #{order.id}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Clientes, artículos y abonos registrados en este pedido.
          </p>

          <div className="mt-5 space-y-6">
            {order.customerOrders.map((customerOrder) => {
              const customerPaid = getCustomerPaidAmount(customerOrder);
              const customerPending = Math.max(
                Number(customerOrder.total) - customerPaid,
                0,
              );

              const areItemsExpanded =
                expandedItemsByCustomer[customerOrder.id] ?? false;

              const arePaymentsExpanded =
                expandedPaymentsByCustomer[customerOrder.id] ?? false;

              const visibleItems = areItemsExpanded
                ? customerOrder.items
                : customerOrder.items.slice(0, SUBTABLE_INITIAL_LIMIT);

              const visiblePayments = arePaymentsExpanded
                ? customerOrder.payments
                : customerOrder.payments.slice(0, SUBTABLE_INITIAL_LIMIT);

              return (
                <div
                  key={customerOrder.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="grid gap-4 bg-slate-100 p-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Cliente
                      </p>

                      <p className="mt-1 font-extrabold text-slate-950">
                        {customerOrder.customer.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {customerOrder.customer.phone ?? "Sin teléfono"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Total
                      </p>

                      <p className="mt-1 font-extrabold text-slate-950">
                        {formatMoney(customerOrder.total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Pagado
                      </p>

                      <p className="mt-1 font-extrabold text-emerald-700">
                        {formatMoney(customerPaid)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Pendiente
                      </p>

                      <p className="mt-1 font-extrabold text-orange-600">
                        {formatMoney(customerPending)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-extrabold text-slate-950">
                        Artículos ({customerOrder.items.length})
                      </p>

                      <ShowMoreButton
                        total={customerOrder.items.length}
                        visibleCount={SUBTABLE_INITIAL_LIMIT}
                        isExpanded={areItemsExpanded}
                        onToggle={() => toggleCustomerItems(customerOrder.id)}
                        label="artículos"
                      />
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                              SKU
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                              Artículo
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                              Cantidad
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                              Precio
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                              Subtotal
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                              Estado
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {visibleItems.map((item) => (
                            <tr key={item.id}>
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-700">
                                {item.skuSnapshot}
                              </td>

                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-950">
                                  {item.nameSnapshot}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {item.descriptionSnapshot ??
                                    "Sin descripción"}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-slate-700">
                                {item.quantity}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-slate-700">
                                {formatMoney(item.unitPriceSnapshot)}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-extrabold text-slate-950">
                                {formatMoney(item.subtotal)}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3 text-right">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                    item.isPaid
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-orange-50 text-orange-700"
                                  }`}
                                >
                                  {item.isPaid ? "Pagado" : "Pendiente"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-extrabold text-slate-950">
                        Abonos registrados ({customerOrder.payments.length})
                      </p>

                      <ShowMoreButton
                        total={customerOrder.payments.length}
                        visibleCount={SUBTABLE_INITIAL_LIMIT}
                        isExpanded={arePaymentsExpanded}
                        onToggle={() => toggleCustomerPayments(customerOrder.id)}
                        label="abonos"
                      />
                    </div>

                    {visiblePayments.length ? (
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                            <tr>
                              <th className="py-2 pr-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                                Fecha
                              </th>

                              <th className="px-4 py-2 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                                Método
                              </th>

                              <th className="px-4 py-2 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                                Notas
                              </th>

                              <th className="py-2 pl-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                                Monto
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-200">
                            {visiblePayments.map((payment) => (
                              <tr key={payment.id}>
                                <td className="whitespace-nowrap py-2 pr-4 text-sm text-slate-600">
                                  {formatDate(payment.createdAt)}
                                </td>

                                <td className="whitespace-nowrap px-4 py-2 text-sm font-bold text-slate-700">
                                  {payment.method}
                                </td>

                                <td className="px-4 py-2 text-sm text-slate-600">
                                  {payment.notes ?? "Sin notas"}
                                </td>

                                <td className="whitespace-nowrap py-2 pl-4 text-right text-sm font-extrabold text-emerald-700">
                                  {formatMoney(payment.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        Este cliente todavía no tiene abonos registrados.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function OrdersPage() {
  const [searchText, setSearchText] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetOrdersQuery();

  const orders = ordersResponse?.data ?? [];

  const filteredOrders = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchText);

    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) => {
      const customerNames = order.customerOrders
        .map((customerOrder) => customerOrder.customer.name)
        .join(" ");

      const searchableText = normalizeSearchText(
        `${order.id} ${order.seller.name} ${order.seller.email} ${customerNames} ${order.status}`,
      );

      return searchableText.includes(normalizedSearch);
    });
  }, [orders, searchText]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedOrderId(null);
  }, [searchText, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(Math.ceil(filteredOrders.length / pageSize), 1);

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredOrders.length, pageSize]);

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING",
  ).length;

  const paidOrders = orders.filter((order) => order.status === "PAID").length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED",
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "CANCELLED",
  ).length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Ventas
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
            Pedidos
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Consulta pedidos, pagos y abre una pantalla completa de detalle.
          </p>
        </div>

        <AppButton variant="outline" onClick={() => refetch()}>
          {isFetching ? "Actualizando..." : "Actualizar"}
        </AppButton>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-400">Total</p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {orders.length}
          </p>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">Pendientes</p>
          <p className="mt-2 text-3xl font-extrabold text-orange-600">
            {pendingOrders}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Pagados</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            {paidOrders}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Entregados</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {deliveredOrders}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">Cancelados</p>
          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {cancelledOrders}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <AppInput
          label="Buscar pedido"
          placeholder="Buscar por pedido, vendedor, cliente o estado"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <p className="mt-4 text-sm text-slate-500">
          Mostrando {filteredOrders.length} de {orders.length} pedidos.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Cargando pedidos...</p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos consultando la API.
          </p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-extrabold text-red-600">
            No se pudieron cargar los pedidos
          </h3>

          <p className="mt-2 text-slate-500">
            Revisa que tu sesión siga activa y que la API responda.
          </p>

          <AppButton className="mt-5" onClick={() => refetch()}>
            Reintentar
          </AppButton>
        </div>
      ) : filteredOrders.length ? (
        <>
          <div className="mt-6 grid gap-4 xl:hidden">
            {paginatedOrders.map((order) => (
              <OrderMobileCard key={order.id} order={order} />
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-14 px-5 py-4 text-left"></th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Pedido
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Clientes
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Vendedor
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Total
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Pagado
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Pendiente
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Estado
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;

                    const customerNames = order.customerOrders
                      .map((customerOrder) => customerOrder.customer.name)
                      .join(", ");

                    const paidAmount = getOrderPaidAmount(order);
                    const pendingAmount = getOrderPendingAmount(order);

                    return (
                      <Fragment key={order.id}>
                        <tr className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId((current) =>
                                  current === order.id ? null : order.id,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-black text-slate-700 hover:bg-slate-100"
                            >
                              {isExpanded ? "−" : "+"}
                            </button>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-extrabold text-slate-950">
                              #{order.id}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(order.purchaseDate)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-xs truncate font-bold text-slate-950">
                              {customerNames || "Sin cliente"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {order.customerOrders.length} cliente
                              {order.customerOrders.length === 1 ? "" : "s"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-bold text-slate-950">
                              {order.seller.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {order.seller.email}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-slate-950">
                            {formatMoney(order.total)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-emerald-700">
                            {formatMoney(paidAmount)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-orange-600">
                            {formatMoney(pendingAmount)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                                order.status,
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <Link
                              to={`/orders/${order.id}`}
                              className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                              Ver detalle
                            </Link>
                          </td>
                        </tr>

                        {isExpanded ? <OrderExpandedRow order={order} /> : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="pedidos"
          />
        </>
      ) : (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">
            No hay pedidos para mostrar.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {searchText.trim()
              ? "Intenta buscar con otro cliente, vendedor o estado."
              : "Cuando existan pedidos aparecerán aquí."}
          </p>
        </div>
      )}
    </AppLayout>
  );
}