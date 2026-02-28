import { useState } from 'react';
import { useEquities, useCreateEquity, useTotalEquity } from '../../hooks/useEquity';
import { useTotalExpenses } from '../../hooks/useStoreExpense';
import { formatCurrency } from '../../utils/currency';
import { CurrencyInput } from '../../components/CurrencyInput';

export default function EquityPage() {
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');

    const { data: equities, isLoading } = useEquities();
    const { data: totalEquity } = useTotalEquity();
    const { data: totalExpenses } = useTotalExpenses();
    const createEquity = useCreateEquity();

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
                <h2 className="mb-4">📋 Riwayat Ekuitas</h2>
                {equities && equities.length > 0 ? (
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
                    </div>
                ) : (
                    <p className="text-muted">Belum ada data ekuitas. Tambahkan data pertama Anda di atas.</p>
                )}
            </div>
        </div>
    );
}
