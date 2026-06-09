import { useState, useEffect } from 'react';
import { CreateInventoryBatchDTO, VariantCombination, InventoryBatch } from '../../../types';
import { useVariantCombinations } from '../../../hooks/useVariantCombinations';
import { useProducts } from '../../../hooks/useProducts';
import { useInventoryBatch, useCreateInventoryBatch, useUpdateInventoryBatch } from '../../../hooks/useInventory';
import { SearchableDropdown } from '../../../components/SearchableDropdown';
import { CurrencyInput } from '../../../components/CurrencyInput';
import { getSkuName } from '../../../utils/sku';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingBatchId: number | null;
    onEditingDone: () => void;
}

export const InventoryModal = ({ isOpen, onClose, onSuccess, editingBatchId, onEditingDone }: InventoryModalProps) => {
    const { data: products } = useProducts();
    const createBatch = useCreateInventoryBatch();
    const updateBatch = useUpdateInventoryBatch();
    const { data: batchDetail, isLoading: isLoadingDetail } = useInventoryBatch(editingBatchId);

    const [formData, setFormData] = useState<CreateInventoryBatchDTO>({
        productId: 0,
        quantity: 1,
        costPrice: 0,
        sellingPrice: 0,
    });
    const [selectedProductId, setSelectedProductId] = useState<number>(0);
    const { data: variants } = useVariantCombinations(selectedProductId);

    // Populate form when editing
    useEffect(() => {
        if (batchDetail && editingBatchId) {
            const combinationId = variants?.find((v) => v.sku === batchDetail.variantName)?.id;
            setFormData({
                productId: batchDetail.productId,
                quantity: batchDetail.quantity,
                costPrice: batchDetail.costPrice,
                sellingPrice: batchDetail.sellingPrice,
                variantCombinationId: combinationId,
            });
            setSelectedProductId(batchDetail.productId);
        }
    }, [batchDetail, editingBatchId, variants]);

    // Reset form when modal opens fresh
    useEffect(() => {
        if (isOpen && !editingBatchId) {
            setFormData({ productId: 0, quantity: 1, costPrice: 0, sellingPrice: 0 });
            setSelectedProductId(0);
        }
    }, [isOpen, editingBatchId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBatchId) {
                await updateBatch.mutateAsync({
                    id: editingBatchId,
                    data: {
                        quantity: formData.quantity,
                        costPrice: formData.costPrice,
                        sellingPrice: formData.sellingPrice,
                    },
                });
            } else {
                await createBatch.mutateAsync(formData);
            }
            onSuccess();
            onEditingDone();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menyimpan stok masuk');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{editingBatchId ? 'Ubah Stok' : 'Tambah Stok Masuk'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                {isLoadingDetail && editingBatchId ? (
                    <div className="modal-body text-center">Memuat detail stok...</div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Produk</label>
                                <SearchableDropdown
                                    options={[
                                        { value: 0, label: 'Pilih produk' },
                                        ...(products?.map((product) => ({
                                            value: product.id,
                                            label: `${product.name} (${product.sku})`,
                                        })) || []),
                                    ]}
                                    value={formData.productId}
                                    onChange={(val) => {
                                        const pid = Number(val);
                                        setFormData({ ...formData, productId: pid, variantCombinationId: undefined });
                                        setSelectedProductId(pid);
                                    }}
                                    placeholder="Pilih produk"
                                    disabled={!!editingBatchId}
                                />
                            </div>

                            {variants && variants.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Varian</label>
                                    <SearchableDropdown
                                        options={variants.map((variant: VariantCombination) => ({
                                            value: variant.id,
                                            label: getSkuName(variant.sku),
                                        }))}
                                        value={formData.variantCombinationId || ''}
                                        onChange={(value) =>
                                            setFormData({ ...formData, variantCombinationId: Number(value) })
                                        }
                                        placeholder="Pilih Varian"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Jumlah</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                                    }
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Harga Beli (Modal)</label>
                                <CurrencyInput
                                    className="form-input"
                                    value={formData.costPrice}
                                    onChange={(value) => setFormData({ ...formData, costPrice: value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Harga Jual</label>
                                <CurrencyInput
                                    className="form-input"
                                    value={formData.sellingPrice}
                                    onChange={(value) => setFormData({ ...formData, sellingPrice: value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
                            <button type="submit" className="btn btn-success" disabled={createBatch.isPending || updateBatch.isPending}>
                                {createBatch.isPending || updateBatch.isPending ? 'Menyimpan...' : (editingBatchId ? 'Simpan Perubahan' : 'Tambah Stok')}
                            </button>
                        </div>
                    </form>
                )}
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
                    background: black;
                    padding: 24px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 560px;
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
                .modal-title {
                    margin: 0;
                    font-size: 1.25rem;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: inherit;
                }
                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                }
                .modal-footer {
                    margin-top: 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
            `}</style>
        </div>
    );
};
