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
import './styles.css';

// Daftar bulan dalam bahasa Indonesia
const DAFTAR_BULAN = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

// Daftar tahun dinamis: mulai dari 2026 sampai tahun sekarang (inklusif)
const generateDaftarTahun = (): number[] => {
    const tahunMulai = 2026;
    const tahunSekarang = new Date().getFullYear();
    const akhir = Math.max(tahunMulai, tahunSekarang);
    const tahunList: number[] = [];
    for (let t = tahunMulai; t <= akhir; t++) {
        tahunList.push(t);
    }
    return tahunList;
};

const DAFTAR_TAHUN = generateDaftarTahun();

export default function StoreExpensePage() {
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    // State filter bulan dan tahun (undefined = tampilkan semua)
    const [filterBulan, setFilterBulan] = useState<number | undefined>(undefined);
    const [filterTahun, setFilterTahun] = useState<number | undefined>(undefined);

    const { data: expenses } = useStoreExpenses(filterBulan, filterTahun);
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
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || 'Gagal menyimpan pengeluaran');
        }
    };

    const handleEdit = (expense: { id: number; amount: number; description: string; category?: string }) => {
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
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || 'Gagal menghapus pengeluaran');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAmount(0);
        setDescription('');
        setCategory('');
    };

    const handleResetFilter = () => {
        setFilterBulan(undefined);
        setFilterTahun(undefined);
    };

    // if (isLoading) {
    //     return <div className="spinner"></div>;
    // }

    return (
        <div>
            <h1>🏪 Pengeluaran Toko</h1>

            {/* Total Expenses Card */}
            <div className="card mb-4 sep-total-card">
                <h3 className="sep-total-label">Total Pengeluaran Aktif</h3>
                <p className="sep-total-amount">
                    {formatCurrency(totalExpenses || 0)}
                </p>
            </div>

            {/* Add/Edit Expense Form */}
            <div className="card mb-4">
                <h2 className="mb-4">{editingId ? '✏️ Ubah Pengeluaran' : '➕ Tambah Pengeluaran Baru'}</h2>
                <form onSubmit={handleSubmit}>
                <div className="sep-form-grid">
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
                        <div className="sep-form-actions">
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
                <div className="sep-list-header">
                    <h2>📋 Daftar Pengeluaran</h2>

                    {/* Filter Bulan & Tahun */}
                    <div className="sep-filter-group">
                        <span className="sep-filter-label">🔍 Filter:</span>

                        <select
                            className="form-input sep-filter-select--month"
                            value={filterBulan ?? ''}
                            onChange={(e) => setFilterBulan(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">Semua Bulan</option>
                            {DAFTAR_BULAN.map((bulan) => (
                                <option key={bulan.value} value={bulan.value}>
                                    {bulan.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-input sep-filter-select--year"
                            value={filterTahun ?? ''}
                            onChange={(e) => setFilterTahun(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">Semua Tahun</option>
                            {DAFTAR_TAHUN.map((tahun) => (
                                <option key={tahun} value={tahun}>
                                    {tahun}
                                </option>
                            ))}
                        </select>

                        {/* Tombol reset filter hanya muncul jika ada filter aktif */}
                        {(filterBulan !== undefined || filterTahun !== undefined) && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleResetFilter}
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>

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
                                            <div className="sep-action-btns">
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
                    <p className="text-muted">
                        {filterBulan !== undefined || filterTahun !== undefined
                            ? 'Tidak ada pengeluaran untuk filter yang dipilih.'
                            : 'Belum ada pengeluaran. Tambahkan pengeluaran pertama Anda di atas.'}
                    </p>
                )}
            </div>
        </div>
    );
}
