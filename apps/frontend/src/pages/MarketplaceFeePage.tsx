import { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useFeesByProduct, useSetFee } from '../hooks/useMarketplaceFees';
import { CreateMarketplaceFeeDTO } from '../types';
import { formatCurrency } from '../utils/currency';
import { CurrencyInput } from '../components/CurrencyInput';

export const MarketplaceFeePage = () => {
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  const { data: fees, isLoading: isLoadingFees } = useFeesByProduct(selectedProductId);
  const setFee = useSetFee();

  const [percentage, setPercentage] = useState<number>(0);
  const [processFee, setProcessFee] = useState<number>(0);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProductId(Number(e.target.value));
    setPercentage(0); // Reset form
    setProcessFee(0); // Reset form
  };

  useEffect(() => {
    if (fees && fees?.length > 0) {
      setPercentage(fees[0].percentage);
      setProcessFee(fees[0].processFee);
    }
  }, [fees])

  const handleSave = async () => { // Fixed: Renamed from handleSetFee to handleSave
    if (!selectedProductId) return;
    
    // Hardcoded for 'SHOPEE' as per request "Biaya Admin Shopee"
    const data: CreateMarketplaceFeeDTO = {
        productId: selectedProductId,
        marketplace: 'SHOPEE',
        percentage: percentage,
        processFee: processFee
    };

    try {
        await setFee.mutateAsync(data);
        alert('Shopee fee updated successfully!');
    } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to update fee');
    }
  };

  if (isLoadingProducts) return <div className="spinner"></div>;

  return (
    <div>
      <h1 className="mb-4">💰 Biaya Admin Shopee</h1>
      <div className="card">
        <div className="form-group mb-4">
            <label className="form-label">Select Product</label>
            <select 
                className="form-select" 
                value={selectedProductId || ''} 
                onChange={handleProductChange}
            >
                <option value="">-- Choose a Product --</option>
                {products?.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
            </select>
        </div>

        {selectedProductId && (
            <div className="mt-4">
                <div className="form-group mb-4">
                    <label className="form-label">Shopee Admin Fee (%)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            className="form-input"
                            style={{ maxWidth: '150px' }}
                            value={percentage}
                            placeholder="e.g. 5.5"
                            step="0.01"
                            min="0"
                            onChange={(e) => setPercentage(parseFloat(e.target.value))}
                        />
                        <span>%</span>
                    </div>
                    <p className="text-muted text-sm mt-1">
                        Note: This percentage will be deducted from the selling price of each unit sold.
                    </p>
                </div>

                <div className="form-group mb-4">
                    <label className="form-label">Process Fee (Rp)</label>
                    <div className="flex items-center gap-2">
                        <CurrencyInput
                            className="form-input"
                            style={{ maxWidth: '200px' }}
                            value={processFee}
                            placeholder="e.g. 5000"
                            onChange={(value) => setProcessFee(value)}
                        />
                    </div>
                    <p className="text-muted text-sm mt-1">
                        Note: Fixed processing fee in Rupiah that will be deducted per unit sold.
                    </p>
                </div>

                <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={setFee.isPending}
                >
                    {setFee.isPending ? 'Saving...' : 'Save Configuration'}
                </button>

                <div className="mt-6">
                    <h4 className="font-bold mb-2">Current Configuration</h4>
                    {isLoadingFees ? (
                        <p>Loading...</p>
                    ) : fees && fees.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Marketplace</th>
                                        <th>Fee Percentage</th>
                                        <th>Process Fee (Rp)</th>
                                        <th>Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map(fee => (
                                        <tr key={fee.id}>
                                            <td>{fee.marketplace}</td>
                                            <td>{fee.percentage}%</td>
                                            <td>{formatCurrency(fee.processFee)}</td>
                                            <td>{new Date(fee.updatedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted">No fee configured for Shopee yet.</p>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
