import { useState } from 'react';
import { useProducts, useCreateProduct, useDeleteProduct } from '../hooks/useProducts';
import { CreateProductDTO, StockMethod } from '../types';
import { VariantManager } from '../components/VariantManager';

export const ProductsPage = () => {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateProductDTO>({
    name: '',
    sku: '',
    stockMethod: 'FIFO',
    sellingPrice: 0,
  });

  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const handleManageVariants = (productId: number) => {
    setSelectedProductId(productId);
    setShowVariantModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync(formData);
      setFormData({ name: '', sku: '', stockMethod: 'FIFO', sellingPrice: 0 });
      setShowForm(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (isLoading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>📦 Products</h1>
          <p className="text-muted">Manage your product catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">Create New Product</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Method</label>
                <select
                  className="form-select"
                  value={formData.stockMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, stockMethod: e.target.value as StockMethod })
                  }
                >
                  <option value="FIFO">FIFO (First In First Out)</option>
                  <option value="LIFO">LIFO (Last In First Out)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Selling Price ($)</label>
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

            <button type="submit" className="btn btn-primary" disabled={createProduct.isPending}>
              {createProduct.isPending ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Product List ({products?.length || 0})</h3>
        </div>

        {products && products.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Stock Method</th>
                  <th>Selling Price</th>
                  <th>Current Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td>
                      <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
                        {product.sku}
                      </code>
                    </td>
                    <td>
                      <span className={`badge badge-${product.stockMethod.toLowerCase()}`}>
                        {product.stockMethod}
                      </span>
                    </td>
                    <td>${product.sellingPrice.toFixed(2)}</td>
                    <td>
                      <span className={product.currentStock < 10 ? 'text-warning' : 'text-success'}>
                        {product.currentStock} units
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary mr-2"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => handleManageVariants(product.id)}
                      >
                        Variants
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleteProduct.isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted">No products found. Create your first product!</p>
        )}
      </div>

      {showVariantModal && selectedProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowVariantModal(false);
                setSelectedProductId(null);
              }}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">Manage Variants</h3>
            <VariantManager productId={selectedProductId} />
          </div>
        </div>
      )}
    </div>
  );
};
