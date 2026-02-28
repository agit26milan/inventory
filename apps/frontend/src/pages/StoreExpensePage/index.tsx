import { useState } from 'react';
import {
    useStoreExpenses,
    useCreateStoreExpense,
    useUpdateStoreExpense,
    useDeleteStoreExpense,
    useTotalExpenses,
} from '../../hooks/useStoreExpense';
import { formatCurrency } from '../../utils/currency';
import { CurrencyInput } from '../../components/CurrencyInput';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { EXPENSE_CATEGORIES } from './constants';

export default function StoreExpensePage() {
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data: expenses, isLoading } = useStoreExpenses();
    const { data: totalExpenses } = useTotalExpenses();
    const createExpense = useCreateStoreExpense();
    const updateExpense = useUpdateStoreExpense();
    const deleteExpense = useDeleteStoreExpense();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description) {
            alert('Harap isi jumlah dan deskripsi pengeluaran');
            return;
        }

        try {
            if (editingId) {
                await updateExpense.mutateAsync({
                    id: editingId,
                    data: {
                        amount: amount,
                        description,
                        category: category ? category.toUpperCase() : undefined,
                    },
                });
                alert('Pengeluaran berhasil diperbarui!');
            } else {
                await createExpense.mutateAsync({
                    amount: amount,
                    description,
                    category: category ? category.toUpperCase() : undefined,
                });
                alert('Pengeluaran berhasil ditambahkan!');
            }

            // Reset form
            setAmount(0);
            setDescription('');
            setCategory('');
            setEditingId(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menyimpan pengeluaran');
        }
    };

    const handleEdit = (expense: any) => {
        setEditingId(expense.id);
        setAmount(expense.amount);
        setDescription(expense.description);
        setCategory(expense.category || '');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
            return;
        }

        try {
            await deleteExpense.mutateAsync(id);
            alert('Pengeluaran berhasil dihapus!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menghapus pengeluaran');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAmount(0);
        setDescription('');
        setCategory('');
    };

    if (isLoading) {
        return <div className="spinner"></div>;
    }

    return (
        <div>
            <h1>🏪 Pengeluaran Toko</h1>

            {/* Total Expenses Card */}
            <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>Total Pengeluaran Aktif</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(totalExpenses || 0)}
                </p>
            </div>

            {/* Add/Edit Expense Form */}
            <div className="card mb-4">
                <h2 className="mb-4">{editingId ? '✏️ Ubah Pengeluaran' : '➕ Tambah Pengeluaran Baru'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div className="form-group">
                            <label className="form-label">Jumlah (Rp) *</label>
                            <CurrencyInput
                                className="form-input"
                                placeholder="0"
                                value={amount}
                                onChange={(value) => setAmount(value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Deskripsi *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="misal: Sewa bulanan, Listrik & Air"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <SearchableDropdown
                                options={EXPENSE_CATEGORIES}
                                value={category}
                                onChange={(val) => setCategory(String(val))}
                                placeholder="Pilih kategori"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={createExpense.isPending || updateExpense.isPending}
                            >
                                {editingId ? 'Simpan' : 'Tambah'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Expenses List */}
            <div className="card">
                <h2 className="mb-4">📋 Daftar Pengeluaran</h2>
                {expenses && expenses.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Deskripsi</th>
                                    <th>Kategori</th>
                                    <th>Jumlah</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.createdAt).toLocaleString()}</td>
                                        <td>{expense.description}</td>
                                        <td>
                                            {expense.category ? (
                                                <span className="badge badge-info">{expense.category}</span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="text-danger">{formatCurrency(expense.amount)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEdit(expense)}
                                                >
                                                    Ubah
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(expense.id)}
                                                    disabled={deleteExpense.isPending}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted">Belum ada pengeluaran. Tambahkan pengeluaran pertama Anda di atas.</p>
                )}
            </div>
        </div>
    );
}
