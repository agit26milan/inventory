import { useState, useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useVariantCombinations } from '../../hooks/useVariantCombinations';
import { useVouchers } from '../../hooks/useVoucher';
import { SaleItem, VariantCombination } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getSkuName } from '../../utils/sku';
import { SearchableDropdown } from '../../components/SearchableDropdown';

interface CartItem extends SaleItem {
    variantName?: string;
}

interface SalesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { items: SaleItem[]; voucherId?: string }) => Promise<void>;
    isPending: boolean;
}

export const SalesFormModal = ({ isOpen, onClose, onSubmit, isPending }: SalesFormModalProps) => {
    const { data: products } = useProducts();
    const [saleItems, setSaleItems] = useState<CartItem[]>([]);
    const [currentItem, setCurrentItem] = useState<CartItem>({
        productId: 0,
        quantity: 1,
    });
    const [selectedProductId, setSelectedProductId] = useState<number>(0);
    const { data: variants } = useVariantCombinations(selectedProductId);
    const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
    const { data: vouchers } = useVouchers();

    const activeVouchers = useMemo(() => (vouchers || []).filter((v) => {
        if (!v.isActive) return false;
        const now = new Date();
        return now >= new Date(v.startDate) && now <= new Date(v.endDate);
    }), [vouchers]);

    const resetForm = () => {
        setSaleItems([]);
        setCurrentItem({ productId: 0, quantity: 1 });
        setSelectedProductId(0);
        setSelectedVoucherId('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addItem = () => {
        if (currentItem.productId && currentItem.quantity > 0) {
            if (variants && variants.length > 0 && !currentItem.variantCombinationId) {
                alert('Silakan pilih varian');
                return;
            }

            const itemToAdd = { ...currentItem };
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
            alert('Silakan tambahkan minimal satu barang ke dalam penjualan');
            return;
        }

        try {
            const itemsPayload = saleItems.map(({ variantName, ...item }) => item);
            await onSubmit({
                items: itemsPayload,
                ...(selectedVoucherId ? { voucherId: selectedVoucherId } : {}),
            });
            resetForm();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || 'Gagal membuat penjualan');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Buat Penjualan Baru</h2>
                    <button className="modal-close" onClick={handleClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="grid grid-3 mb-3">
                            <div className="form-group">
                                <label className="form-label">Produk</label>
                                <SearchableDropdown
                                    options={[
                                        { value: 0, label: 'Pilih produk' },
                                        ...(products?.map((product) => ({
                                            value: product.id,
                                            label: `${product.name} - Stok: ${product.currentStock}`,
                                        })) || [])
                                    ]}
                                    value={currentItem.productId}
                                    onChange={(val) => {
                                        const pid = Number(val);
                                        setCurrentItem({ ...currentItem, productId: pid, variantCombinationId: undefined });
                                        setSelectedProductId(pid);
                                    }}
                                    placeholder="Pilih produk"
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
                                        value={currentItem.variantCombinationId || ''}
                                        onChange={(val) =>
                                            setCurrentItem({ ...currentItem, variantCombinationId: Number(val) })
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
                                    value={currentItem.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })
                                    }
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">&nbsp;</label>
                                <button type="button" className="btn btn-secondary" onClick={addItem}>
                                    + Tambah Barang
                                </button>
                            </div>
                        </div>

                        {saleItems.length > 0 && (
                            <div className="mb-3">
                                <h4>Barang Penjualan:</h4>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Produk</th>
                                                <th>Varian</th>
                                                <th>Jumlah</th>
                                                <th>Aksi</th>
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
                                                                onClick={() => removeItem(index)}
                                                            >
                                                                Hapus
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

                        <div className="form-group mb-3">
                            <label className="form-label">Voucher (Opsional)</label>
                            <SearchableDropdown
                                options={[
                                    { value: '', label: 'Tanpa Voucher' },
                                    ...activeVouchers.map((v) => ({
                                        value: v.id,
                                        label: `${v.code} – ${v.discountType === 'NOMINAL' ? formatCurrency(v.discountValue) : `${v.discountValue}%`} – ${v.name}`,
                                    }))
                                ]}
                                value={selectedVoucherId}
                                onChange={(val) => setSelectedVoucherId(String(val))}
                                placeholder="Pilih Voucher Diskon"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={isPending || saleItems.length === 0}
                        >
                            {isPending ? 'Memproses...' : 'Selesaikan Penjualan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
