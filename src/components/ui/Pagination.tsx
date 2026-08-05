type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
};

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [5, 10, 20],
  onPageChange,
  onPageSizeChange,
  itemLabel = "registros",
}: PaginationProps) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);

  const firstVisibleItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisibleItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  function handlePreviousPage() {
    if (!canGoPrevious) {
      return;
    }

    onPageChange(currentPage - 1);
  }

  function handleNextPage() {
    if (!canGoNext) {
      return;
    }

    onPageChange(currentPage + 1);
  }

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-bold text-slate-950">
          Página {currentPage} de {totalPages}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Mostrando {firstVisibleItem}-{lastVisibleItem} de {totalItems}{" "}
          {itemLabel}.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 sm:justify-start">
          Ver

          <select
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
              onPageChange(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-slate-950"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          por página
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={handlePreviousPage}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={handleNextPage}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}