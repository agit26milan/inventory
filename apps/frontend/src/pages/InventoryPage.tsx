import { useState } from 'react';
import { useInventoryBatches, useCreateInventoryBatch } from '../hooks/useInventory';
import { useProducts } from '../hooks/useProducts';
import { CreateInventoryBatchDTO } from '../types';

export const InventoryPage = () => {
  const { data: batches, isLoading: batchesLoading } = useInventoryBatches();
  const { data: products } = useProducts();
  const createBatch = useCreateInventoryBatch();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateInventoryBatchDTO>({
    productId: 0,
    quantity: 0,
    costPrice: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBatch.mutateAsync(formData);
      setFormData({ productId: 0, quantity: 0, costPrice: 0 });
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
                  onChange={(e) =>
                    setFormData({ ...formData, productId: parseInt(e.target.value) })
                  }
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
                <label className="form-label">Cost Price ($)</label>
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
                  <th>Original Qty</th>
                  <th>Remaining Qty</th>
                  <th>Cost Price</th>
                  <th>Total Value</th>
                  <th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td style={{ fontWeight: 600 }}>{batch.productName}</td>
                    <td>{batch.quantity}</td>
                    <td>
                      <span className={batch.remainingQuantity === 0 ? 'text-muted' : 'text-success'}>
                        {batch.remainingQuantity}
                      </span>
                    </td>
                    <td>${batch.costPrice.toFixed(2)}</td>
                    <td>${(batch.remainingQuantity * batch.costPrice).toFixed(2)}</td>
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
