import React, { useState, useMemo } from 'react';
import { useSales, useCreateSale } from '../../hooks/useSales';
import { SaleItem, Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getSkuName } from '../../utils/sku';
import { LoadingModal } from '../../components/LoadingModal';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { SalesFormModal } from './SalesFormModal';
import styles from './styles.module.css';
import './styles.css';

export const SalesPage: React.FC = (): JSX.Element => {
  const CURRENT_YEAR = new Date().getFullYear();

  const [filterProductName, setFilterProductName] = useState<string>('');
  const [filterVariantName, setFilterVariantName] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>(CURRENT_YEAR);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const MONTH_OPTIONS = useMemo(() => [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ], []);

  const YEAR_OPTIONS = useMemo(() => Array.from({ length: 2026 - CURRENT_YEAR + 1 }, (_, i) => {
    const year = CURRENT_YEAR + i;
    return { value: year, label: String(year) };
  }).reverse(), [CURRENT_YEAR]);

  const filters = useMemo(() => ({
    productName: filterProductName || undefined,
    variantName: filterVariantName || undefined,
    month: filterMonth || undefined,
    year: filterYear || undefined,
    page,
    limit,
  }), [filterProductName, filterVariantName, filterMonth, filterYear, page, limit]);

  const { data: paginatedSales, isLoading } = useSales(filters);
  const sales = paginatedSales?.data || [];
  const meta = paginatedSales?.meta;

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: unknown) => {
    setter(value);
    setPage(1);
  };

  const createSale = useCreateSale();

  const [showModal, setShowModal] = useState<boolean>(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleModalSubmit = async (data: { items: SaleItem[]; voucherId?: string }) => {
    await createSale.mutateAsync(data);
    handleCloseModal();
  };

  return (
    <>
      <LoadingModal isLoading={isLoading} />
      <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>💰 Penjualan</h1>
          <p className="text-muted">Proses transaksi penjualan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Penjualan Baru
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Riwayat Penjualan ({meta?.total || 0})</h3>
        </div>

        <div className={styles.spFilterSection}>
          <div className={styles.spFilterGrid}>
            <div className="form-group">
              <label className="form-label">Cari berdasarkan Nama Produk</label>
              <input
                type="text"
                className="form-input"
                placeholder="Cari produk..."
                value={filterProductName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(setFilterProductName, e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cari berdasarkan Varian</label>
              <input
                type="text"
                className="form-input"
                placeholder="Cari varian..."
                value={filterVariantName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(setFilterVariantName, e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Filter Bulan</label>
              <SearchableDropdown
                options={MONTH_OPTIONS}
                value={filterMonth}
                onChange={(val) => handleFilterChange(setFilterMonth, val === '' ? '' : Number(val))}
                placeholder="Semua Bulan"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Filter Tahun</label>
              <SearchableDropdown
                options={YEAR_OPTIONS}
                value={filterYear}
                onChange={(val) => handleFilterChange(setFilterYear, val === '' ? '' : Number(val))}
                placeholder="Semua Tahun"
              />
            </div>
            <button
              className={`btn btn-secondary ${styles.spFilterClear}`}
              onClick={() => {
                setFilterProductName('');
                setFilterVariantName('');
                setFilterMonth('');
                setFilterYear('');
                setPage(1);
              }}
            >
              Hapus Penyaring
            </button>
          </div>
        </div>

        {sales && sales.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jumlah Barang</th>
                  <th>Detail Barang</th>
                  <th>Total Tagihan</th>
                  <th>HPP (COGS)</th>
                  <th>Diskon Voucher</th>
                  <th>Laba Bersih</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale: Sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.saleDate).toLocaleString()}</td>
                    <td>{sale.items.length} barang</td>
                    <td>{sale.items.map((item) => `${item.productName} - ${getSkuName(item.variantName || '') || '-'} x ${item.quantity}`).join(' | ')} </td>
                    <td className="text-success">{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-danger">{formatCurrency(sale.totalCogs)}</td>
                    <td>
                      {(sale.voucherDiscount ?? 0) > 0 ? (
                        <span className={styles.voucherDiscount}>
                          - {formatCurrency(sale.voucherDiscount!)}
                          {sale.voucherCode && (
                            <small className={styles.voucherCode}>
                              [{sale.voucherCode}]
                            </small>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className={`text-primary-light ${styles.spProfitCell}`}>
                      {formatCurrency(sale.profit)}
                    </td>
                    <td>
                      {sale.totalAmount > 0
                        ? `${((sale.profit / sale.totalAmount) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.totalPages > 1 && (
                <div className={styles.paginationContainer}>
                    <span className={`text-muted ${styles.paginationText}`}>
                        Halaman {meta.page} dari {meta.totalPages} (Total {meta.total} data)
                    </span>
                    <div className={styles.paginationButtons}>
                        <button
                            className={`btn btn-secondary ${styles.btnSm}`}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={meta.page <= 1}
                        >
                            Sebelumnya
                        </button>
                        <button
                            className={`btn btn-secondary ${styles.btnSm}`}
                            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                            disabled={meta.page >= meta.totalPages}
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted">Belum ada penjualan. Buat penjualan pertama Anda!</p>
        )}
      </div>

      <SalesFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        isPending={createSale.isPending}
      />
    </div>
    </>
  );
};
