import { useState, useEffect } from 'react';
import { 
    useInventoryBatches, 
    useCreateInventoryBatch, 
    useUpdateInventoryBatch, 
    useDeleteInventoryBatch,
    useInventoryBatch
} from '../hooks/useInventory';
import { useProducts } from '../hooks/useProducts';
import { useVariantCombinations } from '../hooks/useVariantCombinations';
import { CreateInventoryBatchDTO, VariantCombination, InventoryBatch } from '../types';
import { formatCurrency } from '../utils/currency';
import { getSkuName } from '../utils/sku';

export const InventoryPage = () => {
  // Filter state
  const [filterProductName, setFilterProductName] = useState('');
  const [filterVariantName, setFilterVariantName] = useState('');
  
  // Build filters object
  const filters = {
    productName: filterProductName || undefined,
    variantName: filterVariantName || undefined,
  };

  const { data: batches, isLoading: batchesLoading } = useInventoryBatches(filters);
  const { data: products, isLoading: productsLoading } = useProducts();
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
      if (window.confirm('Are you sure you want to delete this inventory batch? This cannot be undone.')) {
          try {
              await deleteBatch.mutateAsync(id);
          } catch (error: any) {
              alert(error.response?.data?.message || 'Failed to delete batch');
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
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save inventory batch');
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
          <h1>📥 Inventory</h1>
          <p className="text-muted">Manage stock batches and track inventory</p>
        </div>
        <button 
            className="btn btn-primary" 
            onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
            }}
        >
          {showForm ? '✕ Cancel' : '+ Stock In'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">{editingBatchId ? 'Edit Batch' : 'Add Stock Batch'}</h3>
          </div>
          
          {isLoadingDetail && editingBatchId ? (
              <div className="p-4 text-center">Loading batch details...</div>
          ) : (
            <form onSubmit={handleSubmit}>
                <div className="grid grid-3">
                <div className="form-group">
                    <label className="form-label">Product</label>
                    <select
                    className="form-select"
                    value={formData.productId}
                    onChange={(e) => {
                        const pid = parseInt(e.target.value);
                        setFormData({ ...formData, productId: pid, variantCombinationId: undefined });
                        setSelectedProductId(pid);
                    }}
                    required
                    disabled={!!editingBatchId} // Disable product change on edit to simplify logic
                    >
                    <option value={0}>Select a product</option>
                    {products?.map((product) => (
                        <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                        </option>
                    ))}
                    </select>
                </div>

                {/* Variant Selection if available */}
                {variants && variants.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Variant</label>
                        <select
                        className="form-select"
                        value={formData.variantCombinationId || ''}
                        onChange={(e) =>
                            setFormData({ ...formData, variantCombinationId: parseInt(e.target.value) })
                        }
                        disabled={!!editingBatchId} // Disable variant change on edit
                        >
                        <option value="">Select Variant</option>
                        {variants.map((variant: VariantCombination) => (
                            <option key={variant.id} value={variant.id}>
                            {getSkuName(variant.sku)}
                            </option>
                        ))}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Quantity</label>
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
                    <label className="form-label">Cost Price</label>
                    <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.costPrice}
                    onChange={(e) =>
                        setFormData({ ...formData, costPrice: parseFloat(e.target.value) })
                    }
                    required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Selling Price</label>
                    <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                        setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })
                    }
                    required
                    />
                </div>
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="btn btn-success" disabled={createBatch.isPending || updateBatch.isPending}>
                    {createBatch.isPending || updateBatch.isPending ? 'Saving...' : (editingBatchId ? 'Update Batch' : 'Add Stock')}
                    </button>
                    {editingBatchId && (
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div className="card mb-4">
          <h3 className="mb-3">🔍 Filter Inventory</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                      type="text"
                      className="form-input"
                      placeholder="Search by product name..."
                      value={filterProductName}
                      onChange={(e) => setFilterProductName(e.target.value)}
                  />
              </div>
              <div className="form-group">
                  <label className="form-label">Variant Name</label>
                  <input
                      type="text"
                      className="form-input"
                      placeholder="Search by variant..."
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
                      Clear Filters
                  </button>
              </div>
          </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Inventory Batches ({batches?.length || 0})</h3>
        </div>

        {batches && batches.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Original Qty</th>
                  <th>Remaining Qty</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Total Value</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
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
          <p className="text-center text-muted">No inventory batches found. Add your first stock!</p>
        )}
      </div>
    </div>
  );
};
