import { useState } from 'react';
import { useSales, useCreateSale } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useVariantCombinations } from '../hooks/useVariantCombinations';
import { SaleItem, VariantCombination } from '../types';
import { formatCurrency } from '../utils/currency';

// Extend SaleItem for UI display
interface CartItem extends SaleItem {
  variantName?: string;
}

export const SalesPage = () => {
  const { data: sales, isLoading } = useSales();
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const [showForm, setShowForm] = useState(false);
  const [saleItems, setSaleItems] = useState<CartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<CartItem>({
    productId: 0,
    quantity: 0,
  });

  // Track selected product to fetch variants
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const { data: variants } = useVariantCombinations(selectedProductId);

  const addItem = () => {
    if (currentItem.productId && currentItem.quantity > 0) {
      // Check if variant is required but not selected
      if (variants && variants.length > 0 && !currentItem.variantCombinationId) {
          alert('Please select a variant');
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
      setCurrentItem({ productId: 0, quantity: 0 });
      setSelectedProductId(0);
    }
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      alert('Please add at least one item to the sale');
      return;
    }

    try {
      // Strip variantName before sending to API
      const itemsPayload = saleItems.map(({ variantName, ...item }) => item);
      await createSale.mutateAsync({ items: itemsPayload });
      setSaleItems([]);
      setShowForm(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create sale');
    }
  };

  if (isLoading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>💰 Sales</h1>
          <p className="text-muted">Process sales transactions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Sale'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">Create New Sale</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-3 mb-3">
              <div className="form-group">
                <label className="form-label">Product</label>
                <select
                  className="form-select"
                  value={currentItem.productId}
                  onChange={(e) => {
                    const pid = parseInt(e.target.value);
                    setCurrentItem({ ...currentItem, productId: pid, variantCombinationId: undefined });
                    setSelectedProductId(pid);
                  }}
                >
                  <option value={0}>Select a product</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.currentStock}
                    </option>
                  ))}
                </select>
              </div>

               {/* Variant Selection */}
               {variants && variants.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Variant</label>
                    <select
                      className="form-select"
                      value={currentItem.variantCombinationId || ''}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, variantCombinationId: parseInt(e.target.value) })
                      }
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
                  + Add Item
                </button>
              </div>
            </div>

            {saleItems.length > 0 && (
              <div className="mb-3">
                <h4>Sale Items:</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Quantity</th>
                        <th>Actions</th>
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
                                className="btn btn-danger"
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                onClick={() => removeItem(index)}
                              >
                                Remove
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
              {createSale.isPending ? 'Processing...' : 'Complete Sale'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Sales History ({sales?.length || 0})</h3>
        </div>

        {sales && sales.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>COGS</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.saleDate).toLocaleString()}</td>
                    <td>{sale.items.length} item(s)</td>
                    <td className="text-success">{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-danger">{formatCurrency(sale.totalCogs)}</td>
                    <td className="text-primary-light" style={{ fontWeight: 600 }}>
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
          <p className="text-center text-muted">No sales found. Create your first sale!</p>
        )}
      </div>
    </div>
  );
};
