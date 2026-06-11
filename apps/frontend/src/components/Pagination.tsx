interface PaginationMeta {
  page: number;
  totalPages: number;
  total: number;
}

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ meta, onPageChange }: PaginationProps) => {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="pagination">
      <span className="text-muted">
        Halaman {meta.page} dari {meta.totalPages} (Total {meta.total} data)
      </span>
      <div className="pagination__controls">
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
          disabled={meta.page <= 1}
        >
          Sebelumnya
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          disabled={meta.page >= meta.totalPages}
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
};
