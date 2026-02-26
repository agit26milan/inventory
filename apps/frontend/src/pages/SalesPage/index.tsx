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
                <SearchableDropdown
                  options={[
                    { value: 0, label: 'Select a product' },
                    ...(products?.map((product) => ({
                      value: product.id,
                      label: `${product.name} - Stock: ${product.currentStock}`,
                    })) || [])
                  ]}
                  value={currentItem.productId}
                  onChange={(val) => {
                    const pid = Number(val);
                    setCurrentItem({ ...currentItem, productId: pid, variantCombinationId: undefined });
                    setSelectedProductId(pid);
                  }}
                  placeholder="Select a product"
                />
              </div>

               {/* Variant Selection */}
               {variants && variants.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Variant</label>
                    <SearchableDropdown
                      options={variants.map((variant: VariantCombination) => ({
                        value: variant.id,
                        label: getSkuName(variant.sku),
                      }))}
                      value={currentItem.variantCombinationId || ''}
                      onChange={(val) =>
                        setCurrentItem({ ...currentItem, variantCombinationId: Number(val) })
                      }
                      placeholder="Select Variant"
                    />
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
                                className="btn btn-danger sp-btn-remove"
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

        {/* Filter Section */}
        <div className="sp-filter-section">
          <div className="sp-filter-grid">
            <div className="form-group">
              <label className="form-label">Filter by Product Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search product..."
                value={filterProductName}
                onChange={(e) => setFilterProductName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Filter by Variant</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search variant..."
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
              Clear Filters
            </button>
          </div>
        </div>

        {sales && sales.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Sale Item</th>
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
          <p className="text-center text-muted">No sales found. Create your first sale!</p>
        )}
      </div>
    </div>
  );
};
