import { useState } from 'react';
import { 
    useVouchers, 
    useCreateVoucher, 
    useUpdateVoucher, 
    useDeleteVoucher 
} from '../../hooks/useVoucher';
import { Voucher } from '../../types';
import { VoucherModal } from './components/VoucherModal';
import { formatCurrency } from '../../utils/currency';

export const VoucherPage = () => {
    const { data: vouchers, isLoading } = useVouchers();
    const createVoucher = useCreateVoucher();
    const updateVoucher = useUpdateVoucher();
    const deleteVoucher = useDeleteVoucher();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    const handleCreate = () => {
        setSelectedVoucher(null);
        setIsModalOpen(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus voucher ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                await deleteVoucher.mutateAsync(id);
            } catch (error) {
                console.error('Failed to delete voucher:', error);
                alert('Gagal menghapus voucher');
            }
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            // Validasi di Frontend sebelum send to API
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            if (end <= start) {
                alert('Tanggal berakhir harus setelah tanggal mulai.');
                return;
            }

            // Pastikan string date ditransmisikan dalam format ISO Standar untuk Zod Backend
            const payload = {
                ...data,
                startDate: start.toISOString(),
                endDate: end.toISOString()
            };

            if (selectedVoucher) {
                await updateVoucher.mutateAsync({ 
                    id: selectedVoucher.id, 
                    data: payload
                });
            } else {
                await createVoucher.mutateAsync(payload);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Failed to save voucher:', error);
            const errMsg = error?.response?.data?.message || 'Gagal menyimpan voucher. Periksa apakah kode bentrok/sudah digunakan.';
            alert(errMsg);
        }
    };

    const isCurrentlyActive = (v: Voucher) => {
        if (!v.isActive) return false;
        const now = new Date();
        const start = new Date(v.startDate);
        const end = new Date(v.endDate);
        return now >= start && now <= end;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>🎟️ Master Voucher</h1>
                    <p className="text-muted">Kelola promo kode kupon diskon untuk pelanggan</p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + Tambah Voucher
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Promo</th>
                                <th>Nilai Diskon</th>
                                <th>Mulai</th>
                                <th>Berakhir</th>
                                <th>Status Tayang</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : vouchers && vouchers.length > 0 ? (
                                vouchers.map((voucher) => {
                                    const activeLive = isCurrentlyActive(voucher);
                                    return (
                                        <tr key={voucher.id}>
                                            <td>
                                                <strong><code>{voucher.code}</code></strong>
                                            </td>
                                            <td>{voucher.name}</td>
                                            <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                                {voucher.discountType === 'NOMINAL' 
                                                    ? formatCurrency(voucher.discountValue) 
                                                    : `${voucher.discountValue}%`}
                                            </td>
                                            <td>{new Date(voucher.startDate).toLocaleString()}</td>
                                            <td>{new Date(voucher.endDate).toLocaleString()}</td>
                                            <td>
                                                <span 
                                                    style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '12px', 
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        backgroundColor: voucher.isActive ? (activeLive ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)') : 'rgba(220, 53, 69, 0.1)',
                                                        color: voucher.isActive ? (activeLive ? 'var(--success)' : 'var(--warning)') : 'var(--danger)'
                                                    }}
                                                >
                                                    {voucher.isActive ? (activeLive ? 'Aktif' : 'Menunggu / Berakhir') : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleEdit(voucher)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(voucher.id)}
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                                        Belum ada data voucher terdaftar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <VoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedVoucher}
            />
        </div>
    );
};
