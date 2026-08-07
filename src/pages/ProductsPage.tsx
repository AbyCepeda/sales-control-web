import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AppButton } from "../components/ui/AppButton";
import { AppInput } from "../components/ui/AppInput";
import { AppModal } from "../components/ui/AppModal";
import { Pagination } from "../components/ui/Pagination";
import type { Product } from "../features/products/product.types";
import {
  useCreateProductMutation,
  useGetProductsQuery,
} from "../services/productsApi";

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);

  return `$${amount.toFixed(2)}`;
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function ProductMobileCard({ product }: { product: Product }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            SKU {product.sku}
          </p>

          <h3 className="mt-2 wrap-break-word text-lg font-extrabold text-slate-950">
            {product.name}
          </h3>

          {product.description ? (
            <p className="mt-2 text-sm text-slate-500">
              {product.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Sin descripción</p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            product.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {product.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Precio</p>

          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {formatMoney(product.price)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Stock</p>

          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {product.stock}
          </p>
        </div>
      </div>
    </article>
  );
}

type ProductFormState = {
  sku: string;
  name: string;
  description: string;
  price: string;
  stock: string;
};

const initialProductForm: ProductFormState = {
  sku: "",
  name: "",
  description: "",
  price: "",
  stock: "",
};

export function ProductsPage() {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productForm, setProductForm] =
    useState<ProductFormState>(initialProductForm);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetProductsQuery();

  const [createProduct, { isLoading: isCreatingProduct }] =
    useCreateProductMutation();

  const products = productsResponse?.data ?? [];

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchText);

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = normalizeSearchText(
        `${product.sku} ${product.name} ${product.description ?? ""}`,
      );

      return searchableText.includes(normalizedSearch);
    });
  }, [products, searchText]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(
      Math.ceil(filteredProducts.length / pageSize),
      1,
    );

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredProducts.length, pageSize]);

  const activeProducts = products.filter((product) => product.isActive).length;
  const inactiveProducts = products.length - activeProducts;

  function handleOpenCreateModal() {
    setProductForm(initialProductForm);
    setIsCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    if (isCreatingProduct) {
      return;
    }

    setIsCreateModalOpen(false);
    setProductForm(initialProductForm);
  }

  function updateProductForm(field: keyof ProductFormState, value: string) {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateProduct(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const sku = productForm.sku.trim();
    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);

    if (!sku || !name) {
      alert("SKU y nombre son obligatorios.");
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      alert("El precio debe ser mayor a 0.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      alert("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    try {
      await createProduct({
        sku,
        name,
        description: description || null,
        price,
        stock,
      }).unwrap();

      setIsCreateModalOpen(false);
      setProductForm(initialProductForm);
      setCurrentPage(1);
    } catch (error: any) {
      console.log("CREATE_PRODUCT_ERROR:", JSON.stringify(error, null, 2));

      const message =
        error?.data?.message ??
        error?.error ??
        "No se pudo crear el producto.";

      alert(message);
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Catálogo
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
            Productos
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Consulta productos, precios, stock y disponibilidad.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <AppButton variant="outline" onClick={() => refetch()}>
            {isFetching ? "Actualizando..." : "Actualizar"}
          </AppButton>

          <AppButton onClick={handleOpenCreateModal}>
            Nuevo producto
          </AppButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-400">Total</p>

          <p className="mt-2 text-3xl font-extrabold text-white">
            {products.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Activos</p>

          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            {activeProducts}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">Inactivos</p>

          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {inactiveProducts}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <AppInput
          label="Buscar producto"
          placeholder="Buscar por SKU, nombre o descripción"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <p className="mt-4 text-sm text-slate-500">
          Mostrando {filteredProducts.length} de {products.length} productos.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Cargando productos...</p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos consultando la API.
          </p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-extrabold text-red-600">
            No se pudieron cargar los productos
          </h3>

          <p className="mt-2 text-slate-500">
            Revisa que tu sesión siga activa y que la API responda.
          </p>

          <AppButton className="mt-5" onClick={() => refetch()}>
            Reintentar
          </AppButton>
        </div>
      ) : filteredProducts.length ? (
        <>
          <div className="mt-6 grid gap-4 lg:hidden">
            {paginatedProducts.map((product) => (
              <ProductMobileCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      SKU
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Producto
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Precio
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-700">
                        {product.sku}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950">
                          {product.name}
                        </p>

                        <p className="mt-1 max-w-xl text-sm text-slate-500">
                          {product.description ?? "Sin descripción"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-extrabold text-slate-950">
                        {formatMoney(product.price)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-700">
                        {product.stock}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {product.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="productos"
          />
        </>
      ) : (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">
            No hay productos para mostrar.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {searchText.trim()
              ? "Intenta buscar con otro SKU o nombre."
              : "Cuando existan productos aparecerán aquí."}
          </p>
        </div>
      )}

      <AppModal
        title="Nuevo producto"
        description="Registra un producto nuevo para usarlo en los pedidos."
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      >
        <form className="space-y-5" onSubmit={handleCreateProduct}>
          <div className="grid gap-5 sm:grid-cols-2">
            <AppInput
              label="SKU"
              placeholder="Ej. PROD-001"
              value={productForm.sku}
              onChange={(event) => updateProductForm("sku", event.target.value)}
            />

            <AppInput
              label="Nombre"
              placeholder="Nombre del producto"
              value={productForm.name}
              onChange={(event) =>
                updateProductForm("name", event.target.value)
              }
            />
          </div>

          <AppInput
            label="Descripción"
            placeholder="Descripción opcional"
            value={productForm.description}
            onChange={(event) =>
              updateProductForm("description", event.target.value)
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <AppInput
              label="Precio"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={productForm.price}
              onChange={(event) =>
                updateProductForm("price", event.target.value)
              }
            />

            <AppInput
              label="Stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={productForm.stock}
              onChange={(event) =>
                updateProductForm("stock", event.target.value)
              }
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <AppButton
              type="button"
              variant="outline"
              onClick={handleCloseCreateModal}
              disabled={isCreatingProduct}
            >
              Cancelar
            </AppButton>

            <AppButton type="submit" isLoading={isCreatingProduct}>
              Guardar producto
            </AppButton>
          </div>
        </form>
      </AppModal>
    </AppLayout>
  );
}