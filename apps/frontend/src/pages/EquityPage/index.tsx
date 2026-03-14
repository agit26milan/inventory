import { useState } from 'react';
import { useEquities, useCreateEquity, useTotalEquity } from '../../hooks/useEquity';
import { useTotalExpenses } from '../../hooks/useStoreExpense';
import { formatCurrency } from '../../utils/currency';
import { CurrencyInput } from '../../components/CurrencyInput';

export default function EquityPage() {
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');

    const currentDate = new Date();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [filterBulan, setFilterBulan] = useState<number | undefined>(currentDate.getMonth() + 1);
    const [filterTahun, setFilterTahun] = useState<number | undefined>(currentDate.getFullYear());

    const { data: paginatedEquities, isLoading } = useEquities(page, limit, filterBulan, filterTahun);
    const equities = paginatedEquities?.data || [];
    const meta = paginatedEquities?.meta;

    const { data: totalEquity } = useTotalEquity();
    const { data: totalExpenses } = useTotalExpenses();
    const createEquity = useCreateEquity();

    // Reset pagination ketika filter berubah
    const handleFilterChange = (type: 'month' | 'year', value: string) => {
        setPage(1);
        if (type === 'month') {
            setFilterBulan(value ? Number(value) : undefined);
        } else {
            setFilterTahun(value ? Number(value) : undefined);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description) {
            alert('Harap isi semua kolom');
            return;
        }

        try {
            await createEquity.mutateAsync({
                amount: amount,
                description,
            });

            // Reset form
            setAmount(0);
            setDescription('');
            alert('Data ekuitas berhasil ditambahkan!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menambahkan data ekuitas');
        }
    };

    if (isLoading) {
        return <div className="spinner"></div>;
    }

    return (
        <div>
            <h1>💰 Manajemen Ekuitas (Modal)</h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>Total Ekuitas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                        {formatCurrency(totalEquity || 0)}
                    </p>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>Total Pengeluaran</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                        {formatCurrency(totalExpenses || 0)}
                    </p>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>Ekuitas Bersih</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                        {formatCurrency((totalEquity || 0) - (totalExpenses || 0))}
                    </p>
                </div>
            </div>

            {/* Add Equity Form */}
            <div className="card mb-4">
                <h2 className="mb-4">➕ Tambah Data Ekuitas</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div className="form-group">
                            <label className="form-label">Jumlah (Rp)</label>
                            <CurrencyInput
                                className="form-input"
                                placeholder="Bisa positif atau negatif"
                                value={amount}
                                onChange={(value) => setAmount(value)}
                                allowNegative={true}
                            />
                            <small style={{ color: '#888', fontSize: '0.85rem' }}>
                                Positif untuk penambahan modal, negatif untuk penarikan
                            </small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Deskripsi</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="misal: Modal awal, Penarikan pemilik"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={createEquity.isPending}>
                            {createEquity.isPending ? 'Menambahkan...' : 'Tambah Data'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Equity History */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>📋 Riwayat Ekuitas</h2>

                    {/* Filter Bulan & Tahun */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>🔍 Filter:</span>

                        <select
                            className="form-input"
                            style={{ width: 'auto', minWidth: '140px' }}
                            value={filterBulan ?? ''}
                            onChange={(e) => handleFilterChange('month', e.target.value)}
                        >
                            <option value="">Semua Bulan</option>
                            <option value="1">Januari</option>
                            <option value="2">Februari</option>
                            <option value="3">Maret</option>
                            <option value="4">April</option>
                            <option value="5">Mei</option>
                            <option value="6">Juni</option>
                            <option value="7">Juli</option>
                            <option value="8">Agustus</option>
                            <option value="9">September</option>
                            <option value="10">Oktober</option>
                            <option value="11">November</option>
                            <option value="12">Desember</option>
                        </select>

                        <select
                            className="form-input"
                            style={{ width: 'auto', minWidth: '110px' }}
                            value={filterTahun ?? ''}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {equities.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Deskripsi</th>
                                    <th>Jumlah</th>
                                    <th>Jenis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equities.map((equity) => (
                                    <tr key={equity.id}>
                                        <td>{new Date(equity.createdAt).toLocaleString()}</td>
                                        <td>{equity.description}</td>
                                        <td className={equity.amount >= 0 ? 'text-success' : 'text-danger'}>
                                            {formatCurrency(equity.amount)}
                                        </td>
                                        <td>
                                            <span className={`badge ${equity.amount >= 0 ? 'badge-success' : 'badge-danger'}`}>
                                                {equity.amount >= 0 ? 'Modal Masuk' : 'Penarikan'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {meta && meta.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Halaman {meta.page} dari {meta.totalPages} (Total {meta.total} data)
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={meta.page <= 1}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                        disabled={meta.page >= meta.totalPages}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-muted">
                        {filterBulan || filterTahun 
                            ? 'Tidak ada data ekuitas untuk periode ini.' 
                            : 'Belum ada data ekuitas. Tambahkan data pertama Anda di atas.'}
                    </p>
                )}
            </div>
        </div>
    );
}
