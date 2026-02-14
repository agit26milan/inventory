import React, { useState } from 'react';
import { InventoryBatch } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { getSkuName } from '../utils/sku';
import { useBulkUpdateSellingPrice } from '../hooks/useInventory';

interface BulkEditInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedBatches: InventoryBatch[];
    onSuccess: () => void;
}

export const BulkEditInventoryModal: React.FC<BulkEditInventoryModalProps> = ({
    isOpen,
    onClose,
    selectedBatches,
    onSuccess,
}) => {
    const [priceUpdates, setPriceUpdates] = useState<{ [id: number]: number }>(
        selectedBatches.reduce((acc, batch) => ({ ...acc, [batch.id]: batch.sellingPrice }), {})
    );

    const updateMutation = useBulkUpdateSellingPrice();

    if (!isOpen) return null;

    const handlePriceChange = (id: number, value: number) => {
        setPriceUpdates((prev) => ({ ...prev, [id]: value }));
    };

    const handleApplyAll = (value: number) => {
        const newUpdates = { ...priceUpdates };
        selectedBatches.forEach(batch => {
            newUpdates[batch.id] = value;
        });
        setPriceUpdates(newUpdates);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updates = Object.entries(priceUpdates).map(([id, sellingPrice]) => ({
                id: parseInt(id),
                sellingPrice,
            }));
            
            await updateMutation.mutateAsync({ updates });
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update selling prices');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h3>Batch Edit Selling Prices</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="mb-4 p-3 bg-light rounded">
                            <label className="form-label">Set same price for all:</label>
                            <div className="flex gap-2">
                                <CurrencyInput 
                                    className="form-input" 
                                    value={0}
                                    onChange={handleApplyAll}
                                />
                                <button type="button" className="btn btn-secondary btn-sm">Apply</button>
                            </div>
                        </div>

                        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Variant</th>
                                        <th>Current Price</th>
                                        <th>New Selling Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBatches.map((batch) => (
                                        <tr key={batch.id}>
                                            <td>{batch.productName}</td>
                                            <td>{batch.variantName ? getSkuName(batch.variantName) : '-'}</td>
                                            <td>{batch.sellingPrice}</td>
                                            <td>
                                                <CurrencyInput
                                                    className="form-input"
                                                    value={priceUpdates[batch.id] || 0}
                                                    onChange={(val) => handlePriceChange(batch.id, val)}
                                                    required
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 90%;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .modal-body {
                    flex: 1;
                    overflow: auto;
                }
                .modal-footer {
                    margin-top: 20px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .bg-light {
                    background-color: #f8f9fa;
                }
                .rounded {
                    border-radius: 4px;
                }
                .p-3 {
                    padding: 1rem;
                }
            `}</style>
        </div>
    );
};
