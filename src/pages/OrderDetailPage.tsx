import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AppButton } from "../components/ui/AppButton";
import { AppInput } from "../components/ui/AppInput";
import { AppModal } from "../components/ui/AppModal";
import { Pagination } from "../components/ui/Pagination";
import type {
  CustomerOrder,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "../features/orders/order.types";
import {
  useCreateCustomerOrderPaymentMutation,
  useDeleteCustomerOrderPaymentMutation,
  useGetOrderByIdQuery,
} from "../services/ordersApi";

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `$${amount.toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

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

function getStatusClassName(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING: "bg-orange-50 text-orange-700",
    PAID: "bg-emerald-50 text-emerald-700",
    DELIVERED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-50 text-red-600",
  };

  return classes[status];
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

function getCustomerPaidAmount(customerOrder: CustomerOrder) {
  return customerOrder.payments.reduce((total, payment) => {
    return total + Number(payment.amount);
  }, 0);
}

function getCustomerPendingAmount(customerOrder: CustomerOrder) {
  return Math.max(
    Number(customerOrder.total) - getCustomerPaidAmount(customerOrder),
    0,
  );
}

function getCustomerPaymentStatus(customerOrder: CustomerOrder) {
  const total = Number(customerOrder.total);
  const paid = getCustomerPaidAmount(customerOrder);

  if (paid >= total && total > 0) {
    return {
      label: "Pagado",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (paid > 0) {
    return {
      label: "Adelanto",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
  }

  return {
    label: "No pagó",
    className: "bg-red-50 text-red-600 border-red-200",
  };
}

function getItemPaymentStatus(item: OrderItem) {
  if (item.isPaid) {
    return {
      label: "Pagado",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Pendiente",
    className: "bg-red-50 text-red-600",
  };
}

function getPaginatedData<T>(
  items: T[],
  currentPage: number,
  pageSize: number,
) {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return items.slice(startIndex, endIndex);
}

function DetailMetricCard({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value: string;
  variant?: "default" | "dark" | "success" | "warning" | "danger";
}) {
  const variantClassName = {
    default: "bg-white border border-slate-200",
    dark: "bg-slate-950",
    success: "bg-emerald-50 border border-emerald-200",
    warning: "bg-yellow-50 border border-yellow-200",
    danger: "bg-red-50 border border-red-200",
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

      <p className={`mt-2 text-2xl font-extrabold ${valueClassName}`}>
        {value}
      </p>
    </article>
  );
}

function RegisterPaymentModal({
  isOpen,
  customerOrder,
  isLoading,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  customerOrder: CustomerOrder | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    method: PaymentMethod;
    notes: string | null;
  }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setMethod("CASH");
      setNotes("");
    }
  }, [isOpen, customerOrder?.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      alert("Ingresa un monto válido.");
      return;
    }

    onSubmit({
      amount: parsedAmount,
      method,
      notes: notes.trim() || null,
    });
  }

  const pending = customerOrder ? getCustomerPendingAmount(customerOrder) : 0;

  return (
    <AppModal
      title="Registrar abono"
      description={
        customerOrder
          ? `Cliente: ${customerOrder.customer.name} · Pendiente: ${formatMoney(
              pending,
            )}`
          : "Registra un pago para el cliente seleccionado."
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AppInput
          label="Monto"
          type="number"
          min="1"
          step="0.01"
          placeholder="Ejemplo: 250"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Método de pago
          </span>

          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950"
          >
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="CARD">Tarjeta</option>
            <option value="OTHER">Otro</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Notas
          </span>

          <textarea
            placeholder="Ejemplo: Abono inicial, transferencia confirmada, etc."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <AppButton type="button" variant="outline" onClick={onClose}>
            Cancelar
          </AppButton>

          <AppButton type="submit" isLoading={isLoading}>
            Guardar abono
          </AppButton>
        </div>
      </form>
    </AppModal>
  );
}

function PaymentList({
  customerOrder,
  isDeletingPayment,
  onDeletePayment,
}: {
  customerOrder: CustomerOrder;
  isDeletingPayment: boolean;
  onDeletePayment: (paymentId: number) => void;
}) {
  if (!customerOrder.payments.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-700">
          Sin abonos registrados
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Cuando registres un abono aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-100 p-4">
        <h4 className="font-extrabold text-slate-950">
          Abonos registrados ({customerOrder.payments.length})
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Aquí puedes revisar o eliminar pagos capturados por error.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                Fecha
              </th>

              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                Método
              </th>

              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                Notas
              </th>

              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                Monto
              </th>

              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                Acción
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {customerOrder.payments.map((payment) => (
              <tr key={payment.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                  {formatDate(payment.createdAt)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-700">
                  {getPaymentMethodLabel(payment.method)}
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {payment.notes ?? "Sin notas"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-extrabold text-emerald-700">
                  {formatMoney(payment.amount)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={isDeletingPayment}
                    onClick={() => onDeletePayment(payment.id)}
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerMobileCard({
  customerOrder,
  onRegisterPayment,
  isDeletingPayment,
  onDeletePayment,
}: {
  customerOrder: CustomerOrder;
  onRegisterPayment: (customerOrder: CustomerOrder) => void;
  isDeletingPayment: boolean;
  onDeletePayment: (paymentId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentItemPage, setCurrentItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

  const paid = getCustomerPaidAmount(customerOrder);
  const pending = getCustomerPendingAmount(customerOrder);
  const paymentStatus = getCustomerPaymentStatus(customerOrder);

  const paginatedItems = useMemo(() => {
    return getPaginatedData(customerOrder.items, currentItemPage, itemPageSize);
  }, [customerOrder.items, currentItemPage, itemPageSize]);

  useEffect(() => {
    setCurrentItemPage(1);
  }, [itemPageSize]);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Cliente #{customerOrder.customer.id}
          </p>

          <h3 className="mt-2 text-lg font-extrabold text-slate-950">
            {customerOrder.customer.name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Tel: {customerOrder.customer.phone ?? "Sin teléfono"}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${paymentStatus.className}`}
        >
          {paymentStatus.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-100 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">Total</p>
          <p className="mt-1 font-extrabold text-slate-950">
            {formatMoney(customerOrder.total)}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase text-emerald-700">Pagado</p>
          <p className="mt-1 font-extrabold text-emerald-700">
            {formatMoney(paid)}
          </p>
        </div>

        <div className="rounded-2xl bg-yellow-50 p-3">
          <p className="text-xs font-bold uppercase text-yellow-700">
            Pendiente
          </p>
          <p className="mt-1 font-extrabold text-yellow-700">
            {formatMoney(pending)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AppButton
          variant="outline"
          className="w-full"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "Ocultar artículos" : "Ver artículos"}
        </AppButton>

        <AppButton
          className="w-full"
          onClick={() => onRegisterPayment(customerOrder)}
        >
          Registrar abono
        </AppButton>
      </div>

      <PaymentList
        customerOrder={customerOrder}
        isDeletingPayment={isDeletingPayment}
        onDeletePayment={onDeletePayment}
      />

      {isExpanded ? (
        <div className="mt-5">
          <div className="space-y-3">
            {paginatedItems.map((item) => {
              const itemStatus = getItemPaymentStatus(item);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-950">
                        {item.nameSnapshot}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        SKU {item.skuSnapshot}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${itemStatus.className}`}
                    >
                      {itemStatus.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        Cantidad
                      </p>

                      <p className="font-bold text-slate-950">
                        {item.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">Precio</p>

                      <p className="font-bold text-slate-950">
                        {formatMoney(item.unitPriceSnapshot)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        Subtotal
                      </p>

                      <p className="font-bold text-slate-950">
                        {formatMoney(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {customerOrder.items.length > itemPageSize ? (
            <Pagination
              currentPage={currentItemPage}
              totalItems={customerOrder.items.length}
              pageSize={itemPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageChange={setCurrentItemPage}
              onPageSizeChange={setItemPageSize}
              itemLabel="artículos"
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function CustomerOrderRows({
  customerOrder,
  onRegisterPayment,
  isDeletingPayment,
  onDeletePayment,
}: {
  customerOrder: CustomerOrder;
  onRegisterPayment: (customerOrder: CustomerOrder) => void;
  isDeletingPayment: boolean;
  onDeletePayment: (paymentId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentItemPage, setCurrentItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

  const paid = getCustomerPaidAmount(customerOrder);
  const pending = getCustomerPendingAmount(customerOrder);
  const paymentStatus = getCustomerPaymentStatus(customerOrder);

  const paginatedItems = useMemo(() => {
    return getPaginatedData(customerOrder.items, currentItemPage, itemPageSize);
  }, [customerOrder.items, currentItemPage, itemPageSize]);

  useEffect(() => {
    setCurrentItemPage(1);
  }, [itemPageSize]);

  return (
    <Fragment>
      <tr className="hover:bg-slate-50">
        <td className="px-5 py-4">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-black text-slate-700 hover:bg-slate-100"
          >
            {isExpanded ? "−" : "+"}
          </button>
        </td>

        <td className="whitespace-nowrap px-5 py-4">
          <p className="font-extrabold text-slate-950">
            {customerOrder.customer.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            ID #{customerOrder.customer.id}
          </p>
        </td>

        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-700">
          {customerOrder.customer.phone ?? "Sin teléfono"}
        </td>

        <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-slate-950">
          {formatMoney(customerOrder.total)}
        </td>

        <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-emerald-700">
          {formatMoney(paid)}
        </td>

        <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-yellow-700">
          {formatMoney(pending)}
        </td>

        <td className="whitespace-nowrap px-5 py-4 text-right">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${paymentStatus.className}`}
          >
            {paymentStatus.label}
          </span>
        </td>

        <td className="whitespace-nowrap px-5 py-4 text-right">
          <AppButton onClick={() => onRegisterPayment(customerOrder)}>
            Registrar abono
          </AppButton>
        </td>
      </tr>

      {isExpanded ? (
        <tr>
          <td colSpan={8} className="bg-slate-50 px-6 py-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-100 p-4">
                <h4 className="font-extrabold text-slate-950">
                  Artículos de {customerOrder.customer.name}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Subtabla paginada de productos incluidos para este cliente.
                </p>
              </div>

              <div className="overflow-x-auto">
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
                    {paginatedItems.map((item) => {
                      const itemStatus = getItemPaymentStatus(item);

                      return (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-700">
                            {item.skuSnapshot}
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-950">
                              {item.nameSnapshot}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.descriptionSnapshot ?? "Sin descripción"}
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
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${itemStatus.className}`}
                            >
                              {itemStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {customerOrder.items.length > itemPageSize ? (
                <div className="p-4">
                  <Pagination
                    currentPage={currentItemPage}
                    totalItems={customerOrder.items.length}
                    pageSize={itemPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                    onPageChange={setCurrentItemPage}
                    onPageSizeChange={setItemPageSize}
                    itemLabel="artículos"
                  />
                </div>
              ) : null}

              <div className="p-4">
                <PaymentList
                  customerOrder={customerOrder}
                  isDeletingPayment={isDeletingPayment}
                  onDeletePayment={onDeletePayment}
                />
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();

  const orderId = Number(id);

  const [currentCustomerPage, setCurrentCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(5);
  const [selectedCustomerOrder, setSelectedCustomerOrder] =
    useState<CustomerOrder | null>(null);

  const [createPayment, { isLoading: isCreatingPayment }] =
    useCreateCustomerOrderPaymentMutation();

  const [deletePayment, { isLoading: isDeletingPayment }] =
    useDeleteCustomerOrderPaymentMutation();

  const {
    data: orderResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetOrderByIdQuery(orderId, {
    skip: Number.isNaN(orderId),
  });

  const order = orderResponse?.data;

  const paginatedCustomerOrders = useMemo(() => {
    return getPaginatedData(
      order?.customerOrders ?? [],
      currentCustomerPage,
      customerPageSize,
    );
  }, [order?.customerOrders, currentCustomerPage, customerPageSize]);

  useEffect(() => {
    setCurrentCustomerPage(1);
  }, [customerPageSize, orderId]);

  const totalPaid =
    order?.customerOrders.reduce((total, customerOrder) => {
      return total + getCustomerPaidAmount(customerOrder);
    }, 0) ?? 0;

  const totalPending = Math.max(Number(order?.total ?? 0) - totalPaid, 0);

  const totalItems =
    order?.customerOrders.reduce((total, customerOrder) => {
      return total + customerOrder.items.length;
    }, 0) ?? 0;

  function openPaymentModal(customerOrder: CustomerOrder) {
    setSelectedCustomerOrder(customerOrder);
  }

  function closePaymentModal() {
    setSelectedCustomerOrder(null);
  }

  async function handleCreatePayment(data: {
    amount: number;
    method: PaymentMethod;
    notes: string | null;
  }) {
    if (!selectedCustomerOrder) {
      return;
    }

    try {
      await createPayment({
        customerOrderId: selectedCustomerOrder.id,
        body: data,
      }).unwrap();

      closePaymentModal();
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.error ??
        "No se pudo registrar el abono.";

      alert(message);
    }
  }

  async function handleDeletePayment(paymentId: number) {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este abono? Esta acción recalculará el pago del cliente.",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deletePayment(paymentId).unwrap();
    } catch (error: any) {
      const message =
        error?.data?.message ?? error?.error ?? "No se pudo eliminar el abono.";

      alert(message);
    }
  }

  if (Number.isNaN(orderId)) {
    return (
      <AppLayout>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-red-600">
            ID de pedido inválido
          </h2>

          <Link
            to="/orders"
            className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
          >
            Volver a pedidos
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/orders"
            className="text-sm font-bold text-slate-500 hover:text-slate-950"
          >
            ← Volver a pedidos
          </Link>

          <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
            Pedido #{orderId}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Detalle de clientes, artículos, pagos y estado de cobro.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/orders/${orderId}/edit`}
            className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Editar pedido
          </Link>

          <AppButton variant="outline" onClick={() => refetch()}>
            {isFetching ? "Actualizando..." : "Actualizar"}
          </AppButton>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Cargando pedido...</p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos consultando la API.
          </p>
        </div>
      ) : error || !order ? (
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-extrabold text-red-600">
            No se pudo cargar el pedido
          </h3>

          <p className="mt-2 text-slate-500">
            Revisa que el pedido exista y que tu sesión siga activa.
          </p>

          <AppButton className="mt-5" onClick={() => refetch()}>
            Reintentar
          </AppButton>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Vendedor</p>

                <p className="mt-1 text-xl font-extrabold text-slate-950">
                  {order.seller.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {order.seller.email}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Fecha compra
                  </p>

                  <p className="mt-1 font-bold text-slate-950">
                    {formatDate(order.purchaseDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Fecha entrega
                  </p>

                  <p className="mt-1 font-bold text-slate-950">
                    {formatDate(order.deliveryDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Estado
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                      order.status,
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>

            {order.notes ? (
              <div className="mt-5 rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Notas
                </p>

                <p className="mt-1 text-sm text-slate-700">{order.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <DetailMetricCard
              title="Total"
              value={formatMoney(order.total)}
              variant="dark"
            />

            <DetailMetricCard
              title="Pagado"
              value={formatMoney(totalPaid)}
              variant="success"
            />

            <DetailMetricCard
              title="Pendiente"
              value={formatMoney(totalPending)}
              variant="warning"
            />

            <DetailMetricCard
              title="Clientes"
              value={`${order.customerOrders.length}`}
            />

            <DetailMetricCard title="Artículos" value={`${totalItems}`} />
          </div>

          <section className="mt-8">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-950">
                Clientes del pedido
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Clientes paginados. Cada cliente puede desplegar su subtabla de
                artículos, registrar abonos y eliminar pagos capturados por
                error.
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:hidden">
              {paginatedCustomerOrders.map((customerOrder) => (
                <CustomerMobileCard
                  key={customerOrder.id}
                  customerOrder={customerOrder}
                  onRegisterPayment={openPaymentModal}
                  isDeletingPayment={isDeletingPayment}
                  onDeletePayment={handleDeletePayment}
                />
              ))}
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-14 px-5 py-4 text-left"></th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                        Cliente
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                        Teléfono
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
                        Estado de pago
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedCustomerOrders.map((customerOrder) => (
                      <CustomerOrderRows
                        key={customerOrder.id}
                        customerOrder={customerOrder}
                        onRegisterPayment={openPaymentModal}
                        isDeletingPayment={isDeletingPayment}
                        onDeletePayment={handleDeletePayment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {order.customerOrders.length > customerPageSize ? (
              <Pagination
                currentPage={currentCustomerPage}
                totalItems={order.customerOrders.length}
                pageSize={customerPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onPageChange={setCurrentCustomerPage}
                onPageSizeChange={setCustomerPageSize}
                itemLabel="clientes"
              />
            ) : null}
          </section>
        </>
      )}

      <RegisterPaymentModal
        isOpen={Boolean(selectedCustomerOrder)}
        customerOrder={selectedCustomerOrder}
        isLoading={isCreatingPayment}
        onClose={closePaymentModal}
        onSubmit={handleCreatePayment}
      />
    </AppLayout>
  );
}
