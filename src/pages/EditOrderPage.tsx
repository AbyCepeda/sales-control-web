import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AppButton } from "../components/ui/AppButton";
import { AppInput } from "../components/ui/AppInput";
import type {
  CreateOrderCustomerRequest,
  CreateOrderItemRequest,
  Order,
  OrderStatus,
  UpdateFullOrderRequest,
} from "../features/orders/order.types";
import type { Product } from "../features/products/product.types";
import {
  useGetOrderByIdQuery,
  useUpdateFullOrderMutation,
} from "../services/ordersApi";
import { useGetProductsQuery } from "../services/productsApi";

type OrderItemForm = {
  productId: string;
  sku: string;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
  isPaid: boolean;
};

type OrderCustomerForm = {
  name: string;
  phone: string;
  notes: string;
  items: OrderItemForm[];
};

function createEmptyItem(): OrderItemForm {
  return {
    productId: "",
    sku: "",
    name: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    isPaid: false,
  };
}

function createEmptyCustomer(): OrderCustomerForm {
  return {
    name: "",
    phone: "",
    notes: "",
    items: [createEmptyItem()],
  };
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function getItemSubtotal(item: OrderItemForm) {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unitPrice || 0);

  return quantity * unitPrice;
}

function getCustomerTotal(customer: OrderCustomerForm) {
  return customer.items.reduce((total, item) => {
    return total + getItemSubtotal(item);
  }, 0);
}

function getOrderTotal(customers: OrderCustomerForm[]) {
  return customers.reduce((total, customer) => {
    return total + getCustomerTotal(customer);
  }, 0);
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

function buildFormFromOrder(order: Order): OrderCustomerForm[] {
  return order.customerOrders.map((customerOrder) => ({
    name: customerOrder.customer.name,
    phone: customerOrder.customer.phone ?? "",
    notes: customerOrder.notes ?? customerOrder.customer.notes ?? "",
    items: customerOrder.items.map((item) => ({
      productId: item.productId ? String(item.productId) : "",
      sku: item.skuSnapshot,
      name: item.nameSnapshot,
      description: item.descriptionSnapshot ?? "",
      quantity: String(item.quantity),
      unitPrice: String(item.unitPriceSnapshot),
      isPaid: item.isPaid,
    })),
  }));
}

export function EditOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const orderId = Number(id);

  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [notes, setNotes] = useState("");
  const [customers, setCustomers] = useState<OrderCustomerForm[]>([
    createEmptyCustomer(),
  ]);
  const [hasLoadedForm, setHasLoadedForm] = useState(false);

  const {
    data: orderResponse,
    isLoading: isLoadingOrder,
    error: orderError,
    refetch,
  } = useGetOrderByIdQuery(orderId, {
    skip: Number.isNaN(orderId),
  });

  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetProductsQuery();

  const [updateFullOrder, { isLoading: isUpdatingOrder }] =
    useUpdateFullOrderMutation();

  const order = orderResponse?.data;

  const products = useMemo(() => {
    return (productsResponse?.data ?? []).filter((product) => product.isActive);
  }, [productsResponse?.data]);

  const orderTotal = getOrderTotal(customers);

  useEffect(() => {
    if (!order || hasLoadedForm) {
      return;
    }

    setStatus(order.status);
    setNotes(order.notes ?? "");
    setCustomers(buildFormFromOrder(order));
    setHasLoadedForm(true);
  }, [order, hasLoadedForm]);

  function updateCustomer(
    customerIndex: number,
    field: keyof OrderCustomerForm,
    value: string,
  ) {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer, index) => {
        if (index !== customerIndex) {
          return customer;
        }

        return {
          ...customer,
          [field]: value,
        };
      }),
    );
  }

  function addCustomer() {
    setCustomers((currentCustomers) => [
      ...currentCustomers,
      createEmptyCustomer(),
    ]);
  }

  function removeCustomer(customerIndex: number) {
    setCustomers((currentCustomers) => {
      if (currentCustomers.length === 1) {
        alert("El pedido debe tener al menos un cliente.");
        return currentCustomers;
      }

      return currentCustomers.filter((_, index) => index !== customerIndex);
    });
  }

  function addItem(customerIndex: number) {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer, index) => {
        if (index !== customerIndex) {
          return customer;
        }

        return {
          ...customer,
          items: [...customer.items, createEmptyItem()],
        };
      }),
    );
  }

  function removeItem(customerIndex: number, itemIndex: number) {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer, index) => {
        if (index !== customerIndex) {
          return customer;
        }

        if (customer.items.length === 1) {
          alert("Cada cliente debe tener al menos un artículo.");
          return customer;
        }

        return {
          ...customer,
          items: customer.items.filter((_, currentItemIndex) => {
            return currentItemIndex !== itemIndex;
          }),
        };
      }),
    );
  }

  function updateItem(
    customerIndex: number,
    itemIndex: number,
    field: keyof OrderItemForm,
    value: string | boolean,
  ) {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer, currentCustomerIndex) => {
        if (currentCustomerIndex !== customerIndex) {
          return customer;
        }

        return {
          ...customer,
          items: customer.items.map((item, currentItemIndex) => {
            if (currentItemIndex !== itemIndex) {
              return item;
            }

            return {
              ...item,
              [field]: value,
            };
          }),
        };
      }),
    );
  }

  function selectProduct(
    customerIndex: number,
    itemIndex: number,
    productId: string,
  ) {
    const product = products.find((currentProduct) => {
      return String(currentProduct.id) === productId;
    });

    setCustomers((currentCustomers) =>
      currentCustomers.map((customer, currentCustomerIndex) => {
        if (currentCustomerIndex !== customerIndex) {
          return customer;
        }

        return {
          ...customer,
          items: customer.items.map((item, currentItemIndex) => {
            if (currentItemIndex !== itemIndex) {
              return item;
            }

            if (!product) {
              return {
                ...item,
                productId: "",
                sku: "",
                name: "",
                description: "",
                unitPrice: "",
              };
            }

            return {
              ...item,
              productId,
              sku: product.sku,
              name: product.name,
              description: product.description ?? "",
              unitPrice: product.price,
            };
          }),
        };
      }),
    );
  }

  function validateForm() {
    if (!customers.length) {
      alert("Agrega al menos un cliente.");
      return false;
    }

    for (const [customerIndex, customer] of customers.entries()) {
      if (!customer.name.trim()) {
        alert(`El cliente ${customerIndex + 1} necesita nombre.`);
        return false;
      }

      if (!customer.items.length) {
        alert(`El cliente ${customer.name} necesita al menos un artículo.`);
        return false;
      }

      for (const [itemIndex, item] of customer.items.entries()) {
        if (!item.sku.trim()) {
          alert(
            `El artículo ${itemIndex + 1} del cliente ${
              customer.name
            } necesita SKU.`,
          );
          return false;
        }

        if (!item.name.trim()) {
          alert(
            `El artículo ${itemIndex + 1} del cliente ${
              customer.name
            } necesita nombre.`,
          );
          return false;
        }

        if (!Number(item.quantity) || Number(item.quantity) <= 0) {
          alert(
            `El artículo ${item.name} del cliente ${customer.name} necesita cantidad válida.`,
          );
          return false;
        }

        if (!Number(item.unitPrice) || Number(item.unitPrice) <= 0) {
          alert(
            `El artículo ${item.name} del cliente ${customer.name} necesita precio válido.`,
          );
          return false;
        }
      }
    }

    return true;
  }

  function buildRequestBody(): UpdateFullOrderRequest {
    const customersPayload: CreateOrderCustomerRequest[] = customers.map(
      (customer) => {
        const itemsPayload: CreateOrderItemRequest[] = customer.items.map(
          (item) => ({
            sku: item.sku.trim(),
            name: item.name.trim(),
            description: item.description.trim() || null,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            isPaid: item.isPaid,
          }),
        );

        return {
          name: customer.name.trim(),
          phone: customer.phone.trim() || null,
          notes: customer.notes.trim() || null,
          items: itemsPayload,
        };
      },
    );

    return {
      status,
      deliveryDate: null,
      notes: notes.trim() || null,
      customers: customersPayload,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const confirmUpdate = window.confirm(
      "¿Seguro que quieres actualizar este pedido? Se reemplazarán los clientes y artículos actuales.",
    );

    if (!confirmUpdate) {
      return;
    }

    try {
      const response = await updateFullOrder({
        id: orderId,
        body: buildRequestBody(),
      }).unwrap();

      alert("Pedido actualizado correctamente.");
      navigate(`/orders/${response.data.id}`);
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.error ??
        "No se pudo actualizar el pedido.";

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
      {isLoadingOrder ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Cargando pedido...</p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos consultando la información actual.
          </p>
        </div>
      ) : orderError || !order ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-red-600">
            No se pudo cargar el pedido
          </h2>

          <p className="mt-2 text-slate-500">
            Revisa que el pedido exista y que tu sesión siga activa.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <AppButton onClick={() => refetch()}>Reintentar</AppButton>

            <Link
              to="/orders"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-slate-50"
            >
              Volver a pedidos
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to={`/orders/${orderId}`}
                className="text-sm font-bold text-slate-500 hover:text-slate-950"
              >
                ← Volver al detalle
              </Link>

              <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
                Editar pedido #{orderId}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Actualiza clientes, artículos, cantidades, precios y estado del
                pedido.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <AppButton type="button" variant="outline" onClick={addCustomer}>
                Agregar cliente
              </AppButton>

              <AppButton type="submit" isLoading={isUpdatingOrder}>
                Guardar cambios
              </AppButton>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="text-xl font-extrabold text-slate-950">
                Información general
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Estado del pedido
                  </span>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as OrderStatus)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950"
                  >
                    <option value="PENDING">{getStatusLabel("PENDING")}</option>
                    <option value="PAID">{getStatusLabel("PAID")}</option>
                    <option value="DELIVERED">
                      {getStatusLabel("DELIVERED")}
                    </option>
                    <option value="CANCELLED">
                      {getStatusLabel("CANCELLED")}
                    </option>
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Notas del pedido
                  </span>

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ejemplo: pedido especial, ajustes, observaciones, etc."
                    className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-400">
                Total actualizado
              </p>

              <p className="mt-2 text-4xl font-extrabold text-white">
                {formatMoney(orderTotal)}
              </p>

              <p className="mt-4 text-sm text-slate-400">
                Clientes: {customers.length}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Artículos:{" "}
                {customers.reduce((total, customer) => {
                  return total + customer.items.length;
                }, 0)}
              </p>

              <p className="mt-4 text-xs text-slate-500">
                Al guardar, se recalculan los totales del pedido.
              </p>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="font-bold text-slate-950">Cargando productos...</p>
            </div>
          ) : productsError ? (
            <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-extrabold text-red-600">
                No se pudieron cargar los productos
              </h3>

              <p className="mt-2 text-slate-500">
                Revisa que tu sesión esté activa y que la API responda.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {customers.map((customer, customerIndex) => {
                const customerTotal = getCustomerTotal(customer);

                return (
                  <section
                    key={customerIndex}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                          Cliente {customerIndex + 1}
                        </p>

                        <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
                          {customer.name.trim() || "Cliente sin nombre"}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          Total cliente:{" "}
                          <span className="font-extrabold text-slate-950">
                            {formatMoney(customerTotal)}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <AppButton
                          type="button"
                          variant="outline"
                          onClick={() => addItem(customerIndex)}
                        >
                          Agregar artículo
                        </AppButton>

                        <AppButton
                          type="button"
                          variant="danger"
                          onClick={() => removeCustomer(customerIndex)}
                        >
                          Eliminar cliente
                        </AppButton>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <AppInput
                        label="Nombre del cliente"
                        placeholder="Ejemplo: Juan Pérez"
                        value={customer.name}
                        onChange={(event) =>
                          updateCustomer(
                            customerIndex,
                            "name",
                            event.target.value,
                          )
                        }
                      />

                      <AppInput
                        label="Teléfono"
                        placeholder="Ejemplo: 8441234567"
                        value={customer.phone}
                        onChange={(event) =>
                          updateCustomer(
                            customerIndex,
                            "phone",
                            event.target.value,
                          )
                        }
                      />

                      <AppInput
                        label="Notas del cliente"
                        placeholder="Ejemplo: pagará por transferencia"
                        value={customer.notes}
                        onChange={(event) =>
                          updateCustomer(
                            customerIndex,
                            "notes",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="mt-6">
                      <h4 className="font-extrabold text-slate-950">
                        Artículos
                      </h4>

                      <div className="mt-3 space-y-4">
                        {customer.items.map((item, itemIndex) => {
                          const selectedProduct = products.find(
                            (product) => String(product.id) === item.productId,
                          );

                          return (
                            <div
                              key={itemIndex}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="grid gap-4 xl:grid-cols-12">
                                <label className="block xl:col-span-3">
                                  <span className="mb-2 block text-sm font-bold text-slate-700">
                                    Producto
                                  </span>

                                  <select
                                    value={item.productId}
                                    onChange={(event) =>
                                      selectProduct(
                                        customerIndex,
                                        itemIndex,
                                        event.target.value,
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950"
                                  >
                                    <option value="">Seleccionar producto</option>

                                    {products.map((product: Product) => (
                                      <option
                                        key={product.id}
                                        value={String(product.id)}
                                      >
                                        {product.sku} - {product.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <AppInput
                                  label="SKU"
                                  placeholder="SKU"
                                  value={item.sku}
                                  onChange={(event) =>
                                    updateItem(
                                      customerIndex,
                                      itemIndex,
                                      "sku",
                                      event.target.value,
                                    )
                                  }
                                  className="xl:col-span-2"
                                />

                                <AppInput
                                  label="Artículo"
                                  placeholder="Nombre"
                                  value={item.name}
                                  onChange={(event) =>
                                    updateItem(
                                      customerIndex,
                                      itemIndex,
                                      "name",
                                      event.target.value,
                                    )
                                  }
                                  className="xl:col-span-3"
                                />

                                <AppInput
                                  label="Cantidad"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateItem(
                                      customerIndex,
                                      itemIndex,
                                      "quantity",
                                      event.target.value,
                                    )
                                  }
                                  className="xl:col-span-1"
                                />

                                <AppInput
                                  label="Precio"
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(event) =>
                                    updateItem(
                                      customerIndex,
                                      itemIndex,
                                      "unitPrice",
                                      event.target.value,
                                    )
                                  }
                                  className="xl:col-span-1"
                                />

                                <div className="xl:col-span-2">
                                  <p className="mb-2 text-sm font-bold text-slate-700">
                                    Subtotal
                                  </p>

                                  <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-950">
                                    {formatMoney(getItemSubtotal(item))}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                                <AppInput
                                  label="Descripción"
                                  placeholder="Descripción opcional"
                                  value={item.description}
                                  onChange={(event) =>
                                    updateItem(
                                      customerIndex,
                                      itemIndex,
                                      "description",
                                      event.target.value,
                                    )
                                  }
                                />

                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={item.isPaid}
                                      onChange={(event) =>
                                        updateItem(
                                          customerIndex,
                                          itemIndex,
                                          "isPaid",
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    Pagado
                                  </label>

                                  <AppButton
                                    type="button"
                                    variant="danger"
                                    onClick={() =>
                                      removeItem(customerIndex, itemIndex)
                                    }
                                  >
                                    Eliminar
                                  </AppButton>
                                </div>
                              </div>

                              {selectedProduct ? (
                                <p className="mt-3 text-xs text-slate-500">
                                  Stock actual: {selectedProduct.stock}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </form>
      )}
    </AppLayout>
  );
}