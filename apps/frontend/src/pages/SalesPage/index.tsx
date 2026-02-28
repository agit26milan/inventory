import { useState } from 'react';
import { useSales, useCreateSale } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useVariantCombinations } from '../../hooks/useVariantCombinations';
import { SaleItem, VariantCombination } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getSkuName } from '../../utils/sku';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import './style.css';

// Extend SaleItem for UI display
interface CartItem extends SaleItem {
  variantName?: string;
}

export const SalesPage = () => {
  // Filter state
  const [filterProductName, setFilterProductName] = useState('');
  const [filterVariantName, setFilterVariantName] = useState('');

  const filters = {
    productName: filterProductName || undefined,
    variantName: filterVariantName || undefined,
  };

  const { data: sales } = useSales(filters);
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const [showForm, setShowForm] = useState(false);
  const [saleItems, setSaleItems] = useState<CartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<CartItem>({
    productId: 0,
    quantity: 1,
  });

  // Track selected product to fetch variants
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const { data: variants } = useVariantCombinations(selectedProductId);

  const addItem = () => {
    if (currentItem.productId && currentItem.quantity > 0) {
      // Check if variant is required but not selected
      if (variants && variants.length > 0 && !currentItem.variantCombinationId) {
          alert('Silakan pilih varian');
          return;
      }

      // Add variant name if variant is selected
      let itemToAdd = { ...currentItem };
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
      // Strip variantName before sending to API
      const itemsPayload = saleItems.map(({ variantName, ...item }) => item);
      await createSale.mutateAsync({ items: itemsPayload });
      setSaleItems([]);
      setShowForm(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal membuat penjualan');
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

               {/* Variant Selection */}
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
                  onChange={(e) =>
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
                                className="btn btn-danger sp-btn-remove"
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
          <h3 className="card-title">Riwayat Penjualan ({sales?.length || 0})</h3>
        </div>

        {/* Filter Section */}
        <div className="sp-filter-section">
          <div className="sp-filter-grid">
            <div className="form-group">
              <label className="form-label">Cari berdasarkan Nama Produk</label>
              <input
                type="text"
                className="form-input"
                placeholder="Cari produk..."
                value={filterProductName}
                onChange={(e) => setFilterProductName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cari berdasarkan Varian</label>
              <input
                type="text"
                className="form-input"
                placeholder="Cari varian..."
                value={filterVariantName}
                onChange={(e) => setFilterVariantName(e.target.value)}
              />
            </div>
            <button
              className="btn btn-secondary sp-filter-clear"
              onClick={() => {
                setFilterProductName('');
                setFilterVariantName('');
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
                  <th>Laba Bersih</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.saleDate).toLocaleString()}</td>
                    <td>{sale.items.length} barang</td>
                    <td>{sale.items.map((item) => `${item.productName} - ${getSkuName(item.variantName || '') || '-'} x ${item.quantity}`).join(' | ')} </td>
                    <td className="text-success">{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-danger">{formatCurrency(sale.totalCogs)}</td>
                    <td className="text-primary-light sp-profit-cell">
                      {formatCurrency(sale.profit)}
                    </td>
                    <td>
                      {((sale.profit / sale.totalAmount) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted">Belum ada penjualan. Buat penjualan pertama Anda!</p>
        )}
      </div>
    </div>
  );
};
