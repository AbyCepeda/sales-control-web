import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { AppLayout } from "../components/layout/AppLayout";
import { AppButton } from "../components/ui/AppButton";
import { AppInput } from "../components/ui/AppInput";
import { Pagination } from "../components/ui/Pagination";
import type { User, UserRole } from "../features/users/user.types";
import { useGetUsersQuery } from "../services/usersApi";

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

function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    SELLER: "Vendedor",
  };

  return labels[role];
}

function getRoleClassName(role: UserRole) {
  const classes: Record<UserRole, string> = {
    ADMIN: "bg-slate-950 text-white",
    SELLER: "bg-blue-50 text-blue-700",
  };

  return classes[role];
}

function UserMobileCard({ user }: { user: User }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Usuario #{user.id}
          </p>

          <h3 className="mt-2 wrap-break-word text-lg font-extrabold text-slate-950">
            {user.name}
          </h3>

          <p className="mt-2 wrap-break-word text-sm text-slate-500">
            {user.email}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            user.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {user.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Rol</p>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getRoleClassName(
              user.role,
            )}`}
          >
            {getRoleLabel(user.role)}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">
            Registro
          </p>

          <p className="mt-2 text-sm font-bold text-slate-950">
            {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function UsersPage() {
  const authUser = useAppSelector((state) => state.auth.user);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUsersQuery(undefined, {
    skip: authUser?.role !== "ADMIN",
  });

  const users = usersResponse?.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchText);

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = normalizeSearchText(
        `${user.id} ${user.name} ${user.email} ${user.role} ${
          user.isActive ? "activo" : "inactivo"
        }`,
      );

      return searchableText.includes(normalizedSearch);
    });
  }, [users, searchText]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(Math.ceil(filteredUsers.length / pageSize), 1);

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredUsers.length, pageSize]);

  if (authUser?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const adminUsers = users.filter((user) => user.role === "ADMIN").length;
  const sellerUsers = users.filter((user) => user.role === "SELLER").length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = users.length - activeUsers;

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Administración
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
            Usuarios
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Consulta usuarios, roles y estado de acceso.
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
            {users.length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Admins</p>

          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {adminUsers}
          </p>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Vendedores</p>

          <p className="mt-2 text-3xl font-extrabold text-blue-700">
            {sellerUsers}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Activos</p>

          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            {activeUsers}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">Inactivos</p>

          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {inactiveUsers}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <AppInput
          label="Buscar usuario"
          placeholder="Buscar por nombre, correo, rol o estado"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <p className="mt-4 text-sm text-slate-500">
          Mostrando {filteredUsers.length} de {users.length} usuarios.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Cargando usuarios...</p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos consultando la API.
          </p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-extrabold text-red-600">
            No se pudieron cargar los usuarios
          </h3>

          <p className="mt-2 text-slate-500">
            Revisa que tu sesión sea ADMIN y que la API responda.
          </p>

          <AppButton className="mt-5" onClick={() => refetch()}>
            Reintentar
          </AppButton>
        </div>
      ) : filteredUsers.length ? (
        <>
          {/* Mobile / tablet cards */}
          <div className="mt-6 grid gap-4 lg:hidden">
            {paginatedUsers.map((user) => (
              <UserMobileCard key={user.id} user={user} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Usuario
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Correo
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      Rol
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Registro
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-extrabold text-slate-950">
                          {user.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ID #{user.id}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-700">
                        {user.email}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getRoleClassName(
                            user.role,
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-700">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
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
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="usuarios"
          />
        </>
      ) : (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">
            No hay usuarios para mostrar.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {searchText.trim()
              ? "Intenta buscar con otro nombre, correo o rol."
              : "Cuando existan usuarios aparecerán aquí."}
          </p>
        </div>
      )}
    </AppLayout>
  );
}