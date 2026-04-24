import React, { useState, useMemo } from 'react';
import { useSales, useCreateSale } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useVariantCombinations } from '../../hooks/useVariantCombinations';
import { useVouchers } from '../../hooks/useVoucher';
import { SaleItem, VariantCombination } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getSkuName } from '../../utils/sku';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import styles from './styles.module.css';

// Extend SaleItem for UI display
interface CartItem extends SaleItem {
  variantName?: string;
}

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

  const { data: paginatedSales } = useSales(filters);
  const sales = paginatedSales?.data || [];
  const meta = paginatedSales?.meta;

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: unknown) => {
    setter(value);
    setPage(1);
  };

  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [saleItems, setSaleItems] = useState<CartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<CartItem>({
    productId: 0,
    quantity: 1,
  });

  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const { data: variants } = useVariantCombinations(selectedProductId);

  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const { data: vouchers } = useVouchers();

  const activeVouchers = useMemo(() => (vouchers || []).filter((v) => {
    if (!v.isActive) return false;
    const now = new Date();
    return now >= new Date(v.startDate) && now <= new Date(v.endDate);
  }), [vouchers]);

  const addItem = () => {
    if (currentItem.productId && currentItem.quantity > 0) {
      if (variants && variants.length > 0 && !currentItem.variantCombinationId) {
          alert('Silakan pilih varian');
          return;
      }

      const itemToAdd = { ...currentItem };
      if (currentItem.variantCombinationId && variants) {
          const selectedVariant = variants.find(v => v.id === currentItem.variantCombinationId);
          if (selectedVariant) {
              itemToAdd.variantName = selectedVariant.sku;
          }
      }

      setSaleItems([...saleItems, itemToAdd]);
      setCurrentItem({ productId: 0, quantity: 1 });
      setSelectedProductId(0);
    }
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      alert('Silakan tambahkan minimal satu barang ke dalam penjualan');
      return;
    }

    try {
      const itemsPayload = saleItems.map(({ variantName, ...item }) => item);
      await createSale.mutateAsync({
        items: itemsPayload,
        ...(selectedVoucherId ? { voucherId: selectedVoucherId } : {}),
      });
      setSaleItems([]);
      setSelectedVoucherId('');
      setShowForm(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Gagal membuat penjualan');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>💰 Penjualan</h1>
          <p className="text-muted">Proses transaksi penjualan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Batal' : '+ Penjualan Baru'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">Buat Penjualan Baru</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-3 mb-3">
              <div className="form-group">
                <label className="form-label">Produk</label>
                <SearchableDropdown
                  options={[
                    { value: 0, label: 'Pilih produk' },
                    ...(products?.map((product) => ({
                      value: product.id,
                      label: `${product.name} - Stok: ${product.currentStock}`,
                    })) || [])
                  ]}
                  value={currentItem.productId}
                  onChange={(val) => {
                    const pid = Number(val);
                    setCurrentItem({ ...currentItem, productId: pid, variantCombinationId: undefined });
                    setSelectedProductId(pid);
                  }}
                  placeholder="Pilih produk"
                />
              </div>

               {variants && variants.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Varian</label>
                    <SearchableDropdown
                      options={variants.map((variant: VariantCombination) => ({
                        value: variant.id,
                        label: getSkuName(variant.sku),
                      }))}
                      value={currentItem.variantCombinationId || ''}
                      onChange={(val) =>
                        setCurrentItem({ ...currentItem, variantCombinationId: Number(val) })
                      }
                      placeholder="Pilih Varian"
                    />
                  </div>
              )}

              <div className="form-group">
                <label className="form-label">Jumlah</label>
                <input
                  type="number"
                  className="form-input"
                  value={currentItem.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })
                  }
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button type="button" className="btn btn-secondary" onClick={addItem}>
                  + Tambah Barang
                </button>
              </div>
            </div>

            {saleItems.length > 0 && (
              <div className="mb-3">
                <h4>Barang Penjualan:</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th>Varian</th>
                        <th>Jumlah</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, index) => {
                        const product = products?.find((p) => p.id === item.productId);
                        return (
                          <tr key={index}>
                            <td>{product?.name}</td>
                            <td>
                                {item.variantName ? (
                                    <span className="badge badge-secondary">{item.variantName}</span>
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </td>
                            <td>{item.quantity}</td>
                            <td>
                              <button
                                type="button"
                                className={`btn btn-danger ${styles.spBtnRemove}`}
                                onClick={() => removeItem(index)}
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="form-group mb-3">
              <label className="form-label">Voucher (Opsional)</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'Tanpa Voucher' },
                  ...activeVouchers.map((v) => ({
                    value: v.id,
                    label: `${v.code} – ${v.discountType === 'NOMINAL' ? formatCurrency(v.discountValue) : `${v.discountValue}%`} – ${v.name}`,
                  }))
                ]}
                value={selectedVoucherId}
                onChange={(val) => setSelectedVoucherId(String(val))}
                placeholder="Pilih Voucher Diskon"
              />
            </div>

            <button
              type="submit"
              className="btn btn-success"
              disabled={createSale.isPending || saleItems.length === 0}
            >
              {createSale.isPending ? 'Memproses...' : 'Selesaikan Penjualan'}
            </button>
          </form>
        </div>
      )}

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
                {sales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.saleDate).toLocaleString()}</td>
                    <td>{sale.items.length} barang</td>
                    <td>{sale.items.map((item: any) => `${item.productName} - ${getSkuName(item.variantName || '') || '-'} x ${item.quantity}`).join(' | ')} </td>
                    <td className="text-success">{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-danger">{formatCurrency(sale.totalCogs)}</td>
                    <td>
                      {sale.voucherDiscount > 0 ? (
                        <span className={styles.voucherDiscount}>
                          - {formatCurrency(sale.voucherDiscount)}
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
                      {((sale.profit / sale.totalAmount) * 100).toFixed(1)}%
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
    </div>
  );
};
