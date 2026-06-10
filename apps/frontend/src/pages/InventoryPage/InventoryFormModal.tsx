import { useState, useEffect } from 'react';
import { CreateInventoryBatchDTO, VariantCombination, InventoryBatch } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useVariantCombinations } from '../../hooks/useVariantCombinations';
import { CurrencyInput } from '../../components/CurrencyInput';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { getSkuName } from '../../utils/sku';

interface InventoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateInventoryBatchDTO) => Promise<void>;
    editingBatchId: number | null;
    batchDetail: InventoryBatch | null;
    isLoadingDetail: boolean;
    isPending: boolean;
}

const defaultForm: CreateInventoryBatchDTO = {
    productId: 0,
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
};

export const InventoryFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    editingBatchId,
    batchDetail,
    isLoadingDetail,
    isPending,
}: InventoryFormModalProps) => {
    const { data: products } = useProducts();
    const [formData, setFormData] = useState<CreateInventoryBatchDTO>(defaultForm);
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

    const resetForm = () => {
        setFormData(defaultForm);
        setSelectedProductId(0);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {editingBatchId ? 'Ubah Stok' : 'Tambah Stok Masuk'}
                    </h2>
                    <button className="modal-close" onClick={handleClose}>&times;</button>
                </div>

                {isLoadingDetail && editingBatchId ? (
                    <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                        Memuat detail stok...
                    </div>
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
                                        })) || [])
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
                                        setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
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
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-success" disabled={isPending}>
                                {isPending ? 'Menyimpan...' : (editingBatchId ? 'Simpan Perubahan' : 'Tambah Stok')}
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
                    background: #1e293b;
                    padding: 20px;
                    border-radius: 8px;
                    width: 90%;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #475569;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #94a3b8;
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
            `}</style>
        </div>
    );
};
