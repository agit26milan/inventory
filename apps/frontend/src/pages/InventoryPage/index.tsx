import { useState, useEffect } from 'react';
import { 
    useInventoryBatches, 
    useCreateInventoryBatch, 
    useUpdateInventoryBatch, 
    useDeleteInventoryBatch,
    useInventoryBatch
} from '../../hooks/useInventory';
import { useProducts } from '../../hooks/useProducts';
import { useVariantCombinations } from '../../hooks/useVariantCombinations';
import { CreateInventoryBatchDTO, VariantCombination, InventoryBatch } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getSkuName } from '../../utils/sku';
import { CurrencyInput } from '../../components/CurrencyInput';
import { BulkEditInventoryModal } from '../../components/BulkEditInventoryModal';
import { SearchableDropdown } from '../../components/SearchableDropdown';

export const InventoryPage = () => {
  // Filter state
  const [filterProductName, setFilterProductName] = useState('');
  const [filterVariantName, setFilterVariantName] = useState('');
  
  // Build filters object
  const filters = {
    productName: filterProductName || undefined,
    variantName: filterVariantName || undefined,
  };

  const { data: batches, refetch: refetchBatches } = useInventoryBatches(filters);
  const { data: products } = useProducts();
  const createBatch = useCreateInventoryBatch();
  const updateBatch = useUpdateInventoryBatch();
  const deleteBatch = useDeleteInventoryBatch();
  const [showForm, setShowForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  
  // Fetch detailed batch data when editing
  const { data: batchDetail, isLoading: isLoadingDetail } = useInventoryBatch(editingBatchId);

  const [formData, setFormData] = useState<CreateInventoryBatchDTO>({
    productId: 0,
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
  });

  // Bulk Edit State
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  const toggleBatchSelection = (id: number) => {
      setSelectedBatchIds(prev => 
          prev.includes(id) 
              ? prev.filter(batchId => batchId !== id)
              : [...prev, id]
      );
  };

  const toggleAllSelection = () => {
      if (selectedBatchIds.length === batches?.length) {
          setSelectedBatchIds([]);
      } else {
          setSelectedBatchIds(batches?.map(b => b.id) || []);
      }
  };

  const handleBulkUpdateSuccess = () => {
      setSelectedBatchIds([]);
      refetchBatches();
  };

  // State to track selected product's variants
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const { data: variants } = useVariantCombinations(selectedProductId);

  // Effect to populate form when batchDetail is loaded
  useEffect(() => {
      if (batchDetail && editingBatchId) {          
          const combinationId = findCombinationId();
          setFormData({
              productId: batchDetail.productId,
              quantity: batchDetail.quantity,
              costPrice: batchDetail.costPrice,
              sellingPrice: batchDetail.sellingPrice,
              variantCombinationId: combinationId 
          });
          setSelectedProductId(batchDetail.productId);
      }
  }, [batchDetail, editingBatchId, variants]);

  const resetForm = () => {
      setFormData({ productId: 0, quantity: 1, costPrice: 0, sellingPrice: 0 });
      setSelectedProductId(0);
      setEditingBatchId(null);
      setShowForm(false);
  };

  const handleEdit = (batch: InventoryBatch) => {
      setEditingBatchId(batch.id);
      setShowForm(true);
      // Data will be populated by useEffect once useInventoryBatch fetches it
  };

  const findCombinationId = () => {
    return variants?.find((v) => v.sku === batchDetail?.variantName)?.id;
  };

  const handleDelete = async (id: number) => {
      if (window.confirm('Apakah Anda yakin ingin menghapus stok masuk ini? Tindakan ini tidak dapat dibatalkan.')) {
          try {
              await deleteBatch.mutateAsync(id);
          } catch (error: any) {
              alert(error.response?.data?.message || 'Gagal menghapus stok');
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBatchId) {
          await updateBatch.mutateAsync({
              id: editingBatchId,
              data: {
                  quantity: formData.quantity,
                  costPrice: formData.costPrice,
                  sellingPrice: formData.sellingPrice
              }
          });
      } else {
          await createBatch.mutateAsync(formData);
      }
      refetchBatches();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan stok masuk');
    }
  };

  const clearFilters = () => {
      setFilterProductName('');
      setFilterVariantName('');
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>📥 Inventaris</h1>
          <p className="text-muted">Kelola stok barang masuk dan pantau inventaris</p>
        </div>
        <button 
            className="btn btn-primary" 
            onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
            }}
        >
          {showForm ? '✕ Batal' : '+ Stok Masuk'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">{editingBatchId ? 'Ubah Stok' : 'Tambah Stok Masuk'}</h3>
          </div>
          
          {isLoadingDetail && editingBatchId ? (
              <div className="p-4 text-center">Memuat detail stok...</div>
          ) : (
            <form onSubmit={handleSubmit}>
                <div className="grid grid-3">
                <div className="form-group">
                    <label className="form-label">Produk</label>
                    <SearchableDropdown
                        options={[
                            { value: 0, label: 'Pilih produk' },
                            ...(products?.map((product) => ({
                                value: product.id,
                                label: `${product.name} (${product.sku})`,
                            })) || [])
                        ]}
                        value={formData.productId}
                        onChange={(val) => {
                            const pid = Number(val);
                            setFormData({ ...formData, productId: pid, variantCombinationId: undefined });
                            setSelectedProductId(pid);
                        }}
                        placeholder="Pilih produk"
                        disabled={!!editingBatchId}
                    />
                </div>

                {/* Variant Selection if available */}
                {variants && variants.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Varian</label>
                        <SearchableDropdown
                            options={variants.map((variant: VariantCombination) => ({
                                value: variant.id,
                                label: getSkuName(variant.sku),
                            }))}
                            value={formData.variantCombinationId || ''}
                            onChange={(value) =>
                                setFormData({ ...formData, variantCombinationId: Number(value) })
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
                    value={formData.quantity}
                    onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) })
                    }
                    required
                    min="1"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Harga Beli (Modal)</label>
                    <CurrencyInput
                        className="form-input"
                        value={formData.costPrice}
                        onChange={(value) => setFormData({ ...formData, costPrice: value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Harga Jual</label>
                    <CurrencyInput
                        className="form-input"
                        value={formData.sellingPrice}
                        onChange={(value) => setFormData({ ...formData, sellingPrice: value })}
                        required
                    />
                </div>
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="btn btn-success" disabled={createBatch.isPending || updateBatch.isPending}>
                    {createBatch.isPending || updateBatch.isPending ? 'Menyimpan...' : (editingBatchId ? 'Simpan Perubahan' : 'Tambah Stok')}
                    </button>
                    {editingBatchId && (
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            Batal
                        </button>
                    )}
                </div>
            </form>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div className="card mb-4">
          <h3 className="mb-3">🔍 Saring Inventaris</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group">
                  <label className="form-label">Nama Produk</label>
                  <input
                      type="text"
                      className="form-input"
                      placeholder="Cari berdasarkan nama produk..."
                      value={filterProductName}
                      onChange={(e) => setFilterProductName(e.target.value)}
                  />
              </div>
              <div className="form-group">
                  <label className="form-label">Nama Varian</label>
                  <input
                      type="text"
                      className="form-input"
                      placeholder="Cari berdasarkan varian..."
                      value={filterVariantName}
                      onChange={(e) => setFilterVariantName(e.target.value)}
                  />
              </div>
              <div>
                  <button 
                      className="btn btn-secondary" 
                      onClick={clearFilters}
                      disabled={!filterProductName && !filterVariantName}
                  >
                      Hapus Penyaring
                  </button>
              </div>
          </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="card-title">Daftar Stok Masuk ({batches?.length || 0})</h3>
          {selectedBatchIds.length > 0 && (
              <button 
                  className="btn btn-warning btn-sm"
                  onClick={() => setShowBulkEditModal(true)}
              >
                  ✏️ Ubah Harga Jual Sekaligus ({selectedBatchIds.length})
              </button>
          )}
        </div>

        {batches && batches.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                      <input 
                          type="checkbox" 
                          checked={batches?.length > 0 && selectedBatchIds.length === batches?.length}
                          onChange={toggleAllSelection}
                      />
                  </th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Jml Awal</th>
                  <th>Sisa Stok</th>
                  <th>Harga Beli</th>
                  <th>Harga Jual</th>
                  <th>Total Nilai</th>
                  <th>Tgl Masuk</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                        <input 
                            type="checkbox" 
                            checked={selectedBatchIds.includes(batch.id)}
                            onChange={() => toggleBatchSelection(batch.id)}
                        />
                    </td>
                    <td style={{ fontWeight: 600 }}>{batch.productName}</td>
                    <td>
                        {batch.variantName ? (
                            <span className="badge badge-secondary">{getSkuName(batch.variantName)}</span>
                        ) : (
                            <span className="text-muted">-</span>
                        )}
                    </td>
                    <td>{batch.quantity}</td>
                    <td>
                      <span className={batch.remainingQuantity === 0 ? 'text-muted' : 'text-success'}>
                        {batch.remainingQuantity}
                      </span>
                    </td>
                    <td>{formatCurrency(batch.costPrice)}</td>
                    <td>{formatCurrency(batch.sellingPrice)}</td>
                    <td>{formatCurrency(batch.remainingQuantity * batch.costPrice)}</td>
                    <td className="text-muted">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                        <div className="flex gap-2">
                            <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(batch)}
                            >
                                ✏️
                            </button>
                            <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(batch.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted">Belum ada stok barang. Tambahkan stok pertama Anda!</p>
        )}
      </div>

      
      {batches && (
        <BulkEditInventoryModal
            isOpen={showBulkEditModal}
            onClose={() => setShowBulkEditModal(false)}
            selectedBatches={batches.filter(b => selectedBatchIds.includes(b.id))}
            onSuccess={handleBulkUpdateSuccess}
        />
      )}
    </div>
  );
};
