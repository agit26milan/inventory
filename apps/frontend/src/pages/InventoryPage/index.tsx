import { useState, useMemo } from 'react';
import { 
    useInventoryBatches, 
    useCreateInventoryBatch, 
    useUpdateInventoryBatch, 
    useDeleteInventoryBatch,
    useInventoryBatch
} from '../../hooks/useInventory';
import { CreateInventoryBatchDTO, InventoryBatch } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getSkuName } from '../../utils/sku';
import { BulkEditInventoryModal } from '../../components/BulkEditInventoryModal';
import { LoadingModal } from '../../components/LoadingModal';
import { InventoryFormModal } from './InventoryFormModal';
import './styles.css';

export const InventoryPage = () => {
  // Filter state
  const [filterProductName, setFilterProductName] = useState('');
  const [filterVariantName, setFilterVariantName] = useState('');
  
  // Build filters object
  const filters = useMemo(() => ({
    productName: filterProductName || undefined,
    variantName: filterVariantName || undefined,
  }), [filterProductName, filterVariantName]);

  const { data: batches, isLoading, refetch: refetchBatches } = useInventoryBatches(filters);
  const createBatch = useCreateInventoryBatch();
  const updateBatch = useUpdateInventoryBatch();
  const deleteBatch = useDeleteInventoryBatch();
  const [showModal, setShowModal] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  
  // Fetch detailed batch data when editing
  const { data: batchDetail, isLoading: isLoadingDetail } = useInventoryBatch(editingBatchId);

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

  const handleEdit = (batch: InventoryBatch) => {
      setEditingBatchId(batch.id);
      setShowModal(true);
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

  const handleModalSubmit = async (formData: CreateInventoryBatchDTO) => {
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
          handleCloseModal();
      } catch (error: any) {
          alert(error.response?.data?.message || 'Gagal menyimpan stok masuk');
      }
  };

  const handleCloseModal = () => {
      setShowModal(false);
      setEditingBatchId(null);
  };

  const clearFilters = () => {
      setFilterProductName('');
      setFilterVariantName('');
  };

  return (
    <>
      <LoadingModal isLoading={isLoading} />
      <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>📥 Inventaris</h1>
          <p className="text-muted">Kelola stok barang masuk dan pantau inventaris</p>
        </div>
        <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
        >
          + Stok Masuk
        </button>
      </div>

      {/* Filter Section */}
      <div className="card mb-4">
          <h3 className="mb-3">🔍 Saring Inventaris</h3>
          <div className="ip-filter-grid">
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
                    <td className="ip-product-name">{batch.productName}</td>
                    <td>
                        {batch.variantName ? (
                            <span className="badge badge-secondary">{getSkuName(batch.variantName)}</span>
                        ) : (
                            <span className="text-muted">-</span>
                        )}
                    </td>
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

      <InventoryFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleModalSubmit}
          editingBatchId={editingBatchId}
          batchDetail={batchDetail || null}
          isLoadingDetail={isLoadingDetail}
          isPending={createBatch.isPending || updateBatch.isPending}
      />
      
      {batches && (
        <BulkEditInventoryModal
            isOpen={showBulkEditModal}
            onClose={() => setShowBulkEditModal(false)}
            selectedBatches={batches.filter(b => selectedBatchIds.includes(b.id))}
            onSuccess={handleBulkUpdateSuccess}
        />
      )}
    </div>
    </>
  );
};
