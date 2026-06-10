import { useState } from 'react';
import { CreateProductDTO, StockMethod } from '../../types';
import { SearchableDropdown } from '../../components/SearchableDropdown';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProductDTO) => Promise<void>;
    isPending: boolean;
}

export const ProductFormModal = ({ isOpen, onClose, onSubmit, isPending }: ProductFormModalProps) => {
    const [formData, setFormData] = useState<CreateProductDTO>({
        name: '',
        sku: '',
        stockMethod: 'FIFO',
    });

    const resetForm = () => {
        setFormData({ name: '', sku: '', stockMethod: 'FIFO' });
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
        <div className="pp-modal-overlay" onClick={handleClose}>
            <div className="pp-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="pp-modal-close" onClick={handleClose}>✕</button>
                <h3 className="pp-modal-title">Create New Product</h3>
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
                            <SearchableDropdown
                                options={[
                                    { value: 'FIFO', label: 'FIFO (First In First Out)' },
                                    { value: 'LIFO', label: 'LIFO (Last In First Out)' },
                                ]}
                                value={formData.stockMethod}
                                onChange={(val) =>
                                    setFormData({ ...formData, stockMethod: val as StockMethod })
                                }
                                placeholder="Select Stock Method"
                            />
                        </div>
                    </div>

                    <div className="pp-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
