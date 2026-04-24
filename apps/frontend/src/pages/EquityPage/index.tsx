import React, { useState, useMemo } from 'react';
import { useEquities, useCreateEquity, useTotalEquity } from '../../hooks/useEquity';
import { useTotalExpenses } from '../../hooks/useStoreExpense';
import { formatCurrency } from '../../utils/currency';
import { CurrencyInput } from '../../components/CurrencyInput';
import styles from './styles.module.css';

export default function EquityPage(): JSX.Element {
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState<string>('');

    const currentDate = new Date();
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);
    const [filterBulan, setFilterBulan] = useState<number | undefined>(currentDate.getMonth() + 1);
    const [filterTahun, setFilterTahun] = useState<number | undefined>(currentDate.getFullYear());

    const { data: paginatedEquities, isLoading } = useEquities(page, limit, filterBulan, filterTahun);
    const equities = paginatedEquities?.data || [];
    const meta = paginatedEquities?.meta;

    const { data: totalEquity } = useTotalEquity();
    const { data: totalExpenses } = useTotalExpenses();
    const createEquity = useCreateEquity();

    // Kalkulasi net equity menggunakan useMemo untuk menghindari re-render yang tidak perlu
    const netEquity = useMemo<number>(() => {
        return (totalEquity || 0) - (totalExpenses || 0);
    }, [totalEquity, totalExpenses]);

    // Opsi tahun filter
    const yearOptions = useMemo<number[]>(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }, []);

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
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || 'Gagal menambahkan data ekuitas');
        }
    };

    if (isLoading) {
        return <div className="spinner"></div>;
    }

    return (
        <div>
            <h1>💰 Manajemen Ekuitas (Modal)</h1>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={`card ${styles.cardEquity}`}>
                    <h3 className={styles.cardTitle}>Total Ekuitas</h3>
                    <p className={styles.cardValue}>
                        {formatCurrency(totalEquity || 0)}
                    </p>
                </div>
                <div className={`card ${styles.cardExpense}`}>
                    <h3 className={styles.cardTitle}>Total Pengeluaran</h3>
                    <p className={styles.cardValue}>
                        {formatCurrency(totalExpenses || 0)}
                    </p>
                </div>
                <div className={`card ${styles.cardNet}`}>
                    <h3 className={styles.cardTitle}>Ekuitas Bersih</h3>
                    <p className={styles.cardValue}>
                        {formatCurrency(netEquity)}
                    </p>
                </div>
            </div>

            {/* Add Equity Form */}
            <div className="card mb-4">
                <h2 className="mb-4">➕ Tambah Data Ekuitas</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div className="form-group">
                            <label className="form-label">Jumlah (Rp)</label>
                            <CurrencyInput
                                className="form-input"
                                placeholder="Bisa positif atau negatif"
                                value={amount}
                                onChange={(value: number) => setAmount(value)}
                                allowNegative={true}
                            />
                            <small className={styles.helpText}>
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
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
                <div className={styles.historyHeader}>
                    <h2 className={styles.historyTitle}>📋 Riwayat Ekuitas</h2>

                    {/* Filter Bulan & Tahun */}
                    <div className={styles.filterContainer}>
                        <span className={styles.filterLabel}>🔍 Filter:</span>

                        <select
                            className={`form-input ${styles.selectMonth}`}
                            value={filterBulan ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('month', e.target.value)}
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
                            className={`form-input ${styles.selectYear}`}
                            value={filterTahun ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('year', e.target.value)}
                        >
                            {yearOptions.map((year) => (
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
                                {equities.map((equity: any) => (
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
                            <div className={styles.paginationContainer}>
                                <span className={`text-muted ${styles.paginationText}`}>
                                    Halaman {meta.page} dari {meta.totalPages} (Total {meta.total} data)
                                </span>
                                <div className={styles.paginationButtons}>
                                    <button
                                        className={`btn btn-secondary ${styles.btnSm}`}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={meta.page <= 1}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className={`btn btn-secondary ${styles.btnSm}`}
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
