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
             alert(error.response?.data?.message || 'Failed to create variant');
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
             alert(error.response?.data?.message || 'Failed to create variant value');
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
            alert(error.response?.data?.message || 'Failed to update variant');
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
            alert(error.response?.data?.message || 'Failed to update variant value');
        }
    };

    const handleDeleteVariant = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this variant? All related values will be deleted.')) {
             try {
                await deleteVariant.mutateAsync(id);
             } catch (error: any) {
                alert(error.response?.data?.message || 'Failed to delete variant');
             }
        }
    };

    const handleDeleteVariantValue = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this value?')) {
             try {
                await deleteVariantValue.mutateAsync(id);
             } catch (error: any) {
                alert(error.response?.data?.message || 'Failed to delete variant value');
             }
        }
    };

    if (isLoading) return <div className="text-center py-4">Loading variants...</div>;

    return (
        <div className="variant-manager">
            <h4 className="mb-3">Manage Variants</h4>
            
            <form onSubmit={handleCreateVariant} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    className="form-input flex-1"
                    placeholder="New Variant Name (e.g. Size, Color)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={createVariant.isPending}>
                    {createVariant.isPending ? 'Adding...' : 'Add Variant'}
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
                                        Save
                                    </button>
                                    <button 
                                        className="btn btn-secondary btn-sm" 
                                        onClick={() => setEditingVariant(null)}
                                    >
                                        Cancel
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
                                        Edit
                                    </button>
                                    <button 
                                        className="text-danger text-sm hover:underline"
                                        onClick={() => handleDeleteVariant(variant.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pl-3 border-l-2 border-primary-light">
                            <div className="flex flex-wrap gap-2 mb-2">
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
                                                title="Click to edit"
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
                                    placeholder={`Add ${variant.name} value...`}
                                    value={newValueNames[variant.id] || ''}
                                    onChange={(e) => setNewValueNames({ ...newValueNames, [variant.id]: e.target.value })}
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-secondary btn-sm"
                                    disabled={createVariantValue.isPending}
                                >
                                    Add Value
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {variants?.length === 0 && (
                    <p className="text-muted text-sm text-center italic">No variants created yet.</p>
                )}
            </div>
        </div>
    );
};
