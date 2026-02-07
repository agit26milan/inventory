import { useState } from 'react';
import { useSales, useCreateSale } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { SaleItem } from '../types';

export const SalesPage = () => {
  const { data: sales, isLoading } = useSales();
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const [showForm, setShowForm] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SaleItem>({
    productId: 0,
    quantity: 0,
  });

  const addItem = () => {
    if (currentItem.productId && currentItem.quantity > 0) {
      setSaleItems([...saleItems, currentItem]);
      setCurrentItem({ productId: 0, quantity: 0 });
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
      await createSale.mutateAsync({ items: saleItems });
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
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, productId: parseInt(e.target.value) })
                  }
                >
                  <option value={0}>Select a product</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.currentStock}
                    </option>
                  ))}
                </select>
              </div>

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
                    <td className="text-success">${sale.totalAmount.toFixed(2)}</td>
                    <td className="text-danger">${sale.totalCogs.toFixed(2)}</td>
                    <td className="text-primary-light" style={{ fontWeight: 600 }}>
                      ${sale.profit.toFixed(2)}
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
