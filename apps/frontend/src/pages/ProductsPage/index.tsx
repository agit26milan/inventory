import { useState } from 'react';

import { useProducts, useCreateProduct, useDeleteProduct } from '../../hooks/useProducts';
import { CreateProductDTO } from '../../types';
import { VariantManager } from '../../components/VariantManager';
import { ProductFormModal } from './ProductFormModal';
import './styles.css';

export const ProductsPage = () => {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const handleManageVariants = (productId: number) => {
    setSelectedProductId(productId);
    setShowVariantModal(true);
  };

  const handleCreateProduct = async (data: CreateProductDTO) => {
    try {
      const newProduct = await createProduct.mutateAsync(data);
      setShowFormModal(false);

      // Open variant manager for the new product
      handleManageVariants(newProduct.id);
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
        <button className="btn btn-primary" onClick={() => setShowFormModal(true)}>
          + Add Product
        </button>
      </div>

      <ProductFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleCreateProduct}
        isPending={createProduct.isPending}
      />

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
                  <th>Current Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="pp-product-name">{product.name}</td>
                    <td>
                      <code className="pp-sku-badge">
                        {product.sku}
                      </code>
                    </td>
                    <td>
                      <span className={`badge badge-${product.stockMethod.toLowerCase()}`}>
                        {product.stockMethod}
                      </span>
                    </td>
                    <td>
                      <span className={product.currentStock < 10 ? 'text-warning' : 'text-success'}>
                        {product.currentStock} units
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary mr-2 pp-action-btn"
                        onClick={() => handleManageVariants(product.id)}
                      >
                        Variants
                      </button>
                      <button
                        className="btn btn-danger pp-action-btn"
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
        <div className="pp-modal-overlay">
          <div className="pp-modal-content">
            <button
              className="pp-modal-close"
              onClick={() => {
                setShowVariantModal(false);
                setSelectedProductId(null);
              }}
            >
              ✕
            </button>
            <h3 className="pp-modal-title">Manage Variants</h3>
            <VariantManager productId={selectedProductId} />
          </div>
        </div>
      )}
    </div>
  );
};
