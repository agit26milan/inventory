import { useState } from 'react';
import { 
    useVariants, 
    useCreateVariant, 
    useUpdateVariant, 
    useDeleteVariant,
    useCreateVariantValue,
    useUpdateVariantValue,
    useDeleteVariantValue
} from '../hooks/useVariants';
import { Variant } from '../types';
import './VariantManager.css';

interface VariantManagerProps {
    productId: number;
}

export const VariantManager = ({ productId }: VariantManagerProps) => {
    const { data: variants, isLoading } = useVariants(productId);
    const createVariant = useCreateVariant();
    const updateVariant = useUpdateVariant();
    const deleteVariant = useDeleteVariant();
    const createVariantValue = useCreateVariantValue();
    const updateVariantValue = useUpdateVariantValue();
    const deleteVariantValue = useDeleteVariantValue();

    const [newVariantName, setNewVariantName] = useState('');
    const [newValueNames, setNewValueNames] = useState<{ [key: number]: string }>({});
    const [editingVariant, setEditingVariant] = useState<{ id: number; name: string } | null>(null);
    const [editingValue, setEditingValue] = useState<{ id: number; name: string } | null>(null);

    const handleCreateVariant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVariantName.trim()) return;

        try {
            await createVariant.mutateAsync({
                productId,
                name: newVariantName
            });
            setNewVariantName('');
        } catch (error: any) {
             alert(error.response?.data?.message || 'Gagal membuat varian');
        }
    };

    const handleCreateVariantValue = async (variantId: number, e: React.FormEvent) => {
        e.preventDefault();
        const valueName = newValueNames[variantId];
        if (!valueName?.trim()) return;

        try {
            await createVariantValue.mutateAsync({
                variantId,
                data: { name: valueName }
            });
            setNewValueNames({ ...newValueNames, [variantId]: '' });
        } catch (error: any) {
             alert(error.response?.data?.message || 'Gagal membuat nilai varian');
        }
    };

    const handleUpdateVariant = async () => {
        if (!editingVariant || !editingVariant.name.trim()) return;
        try {
            await updateVariant.mutateAsync({
                id: editingVariant.id,
                data: { name: editingVariant.name }
            });
            setEditingVariant(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal memperbarui varian');
        }
    };

    const handleUpdateVariantValue = async () => {
        if (!editingValue || !editingValue.name.trim()) return;
        try {
            await updateVariantValue.mutateAsync({
                id: editingValue.id,
                data: { name: editingValue.name }
            });
            setEditingValue(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal memperbarui nilai varian');
        }
    };

    const handleDeleteVariant = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus varian ini? Semua nilai yang terkait juga akan dihapus.')) {
             try {
                await deleteVariant.mutateAsync(id);
             } catch (error: any) {
                alert(error.response?.data?.message || 'Gagal menghapus varian');
             }
        }
    };

    const handleDeleteVariantValue = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus nilai ini?')) {
             try {
                await deleteVariantValue.mutateAsync(id);
             } catch (error: any) {
                alert(error.response?.data?.message || 'Gagal menghapus nilai varian');
             }
        }
    };

    if (isLoading) return <div className="text-center py-4">Memuat varian...</div>;

    return (
        <div className="variant-manager">
            <h4 className="mb-3">Kelola Varian</h4>
            
            <form onSubmit={handleCreateVariant} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    className="form-input flex-1"
                    placeholder="Nama Varian Baru (mis. Ukuran, Warna)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={createVariant.isPending}>
                    {createVariant.isPending ? 'Menambahkan...' : 'Tambah Varian'}
                </button>
            </form>

            <div className="flex flex-col gap-4">
                {variants?.map((variant: Variant) => (
                    <div key={variant.id} className="border rounded p-3 bg-secondary">
                        <div className="flex justify-between items-center mb-2">
                            {editingVariant?.id === variant.id ? (
                                <div className="flex gap-2 flex-1">
                                    <input 
                                        type="text" 
                                        className="form-input py-1 text-sm"
                                        value={editingVariant.name}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                                    />
                                    <button 
                                        className="btn btn-success btn-sm" 
                                        onClick={handleUpdateVariant}
                                        disabled={updateVariant.isPending}
                                    >
                                        Simpan
                                    </button>
                                    <button 
                                        className="btn btn-secondary btn-sm" 
                                        onClick={() => setEditingVariant(null)}
                                    >
                                        Batal
                                    </button>
                                </div>
                            ) : (
                                <h5 className="font-semibold">{variant.name}</h5>
                            )}
                            
                            {editingVariant?.id !== variant.id && (
                                <div className="flex gap-2">
                                    <button 
                                        className="text-primary text-sm hover:underline"
                                        onClick={() => setEditingVariant({ id: variant.id, name: variant.name })}
                                    >
                                        Ubah
                                    </button>
                                    <button 
                                        className="text-danger text-sm hover:underline"
                                        onClick={() => handleDeleteVariant(variant.id)}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pl-3 border-l-2 border-primary-light">
                            <div className="flex flex-wrap gap-2 mb-2 variant-container">
                                {variant.values?.map((value) => (
                                    <span key={value.id} className="badge badge-primary flex items-center gap-1">
                                        {editingValue?.id === value.id ? (
                                            <>
                                                <input 
                                                    type="text" 
                                                    className="w-16 h-5 text-xs px-1 rounded text-black"
                                                    value={editingValue.name}
                                                    onChange={(e) => setEditingValue({ ...editingValue, name: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateVariantValue();
                                                        if (e.key === 'Escape') setEditingValue(null);
                                                    }}
                                                    autoFocus
                                                />
                                            </>
                                        ) : (
                                            <span 
                                                className="cursor-pointer" 
                                                onClick={() => setEditingValue({ id: value.id, name: value.name })}
                                                title="Klik untuk mengubah"
                                            >
                                                {value.name}
                                            </span>
                                        )}
                                        <button 
                                            className="ml-1 hover:text-red-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteVariantValue(value.id);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <form onSubmit={(e) => handleCreateVariantValue(variant.id, e)} className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="form-input form-input-sm flex-1"
                                    placeholder={`Tambah nilai ${variant.name}...`}
                                    value={newValueNames[variant.id] || ''}
                                    onChange={(e) => setNewValueNames({ ...newValueNames, [variant.id]: e.target.value })}
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-secondary btn-sm"
                                    disabled={createVariantValue.isPending}
                                >
                                    Tambah Nilai
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {variants?.length === 0 && (
                    <p className="text-muted text-sm text-center italic">Belum ada varian yang dibuat.</p>
                )}
            </div>
        </div>
    );
};
