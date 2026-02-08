import { useState } from 'react';
import { useInventoryBatches, useCreateInventoryBatch } from '../hooks/useInventory';
import { useProducts } from '../hooks/useProducts';
import { useVariantCombinations } from '../hooks/useVariantCombinations';
import { CreateInventoryBatchDTO, VariantCombination } from '../types';
import { formatCurrency } from '../utils/currency';

export const InventoryPage = () => {
  const { data: batches, isLoading: batchesLoading } = useInventoryBatches();
  const { data: products } = useProducts();
  const createBatch = useCreateInventoryBatch();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateInventoryBatchDTO>({
    productId: 0,
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
  });

  // State to track selected product's variants
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const { data: variants } = useVariantCombinations(selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBatch.mutateAsync(formData);
      setFormData({ productId: 0, quantity: 0, costPrice: 0, sellingPrice: 0 });
      setSelectedProductId(0);
      setShowForm(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create inventory batch');
    }
  };

  if (batchesLoading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>📥 Inventory</h1>
          <p className="text-muted">Manage stock batches and track inventory</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Stock In'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">Add Stock Batch</h3>
          </div>
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
                      required
                    >
                      <option value="">Select Variant</option>
                      {variants.map((variant: VariantCombination) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.sku}
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

            <button type="submit" className="btn btn-success" disabled={createBatch.isPending}>
              {createBatch.isPending ? 'Adding...' : 'Add Stock'}
            </button>
          </form>
        </div>
      )}

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
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td style={{ fontWeight: 600 }}>{batch.productName}</td>
                    <td>
                        {batch.variantName ? (
                            <span className="badge badge-secondary">{batch.variantName}</span>
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
