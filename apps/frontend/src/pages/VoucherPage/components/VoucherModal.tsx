import { Voucher } from '../../../types';

interface VoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: Voucher | null;
}

export const VoucherModal = ({ isOpen, onClose, onSubmit, initialData }: VoucherModalProps) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        let discountValue = Number(formData.get('discountValue'));
        const discountType = formData.get('discountType') as 'NOMINAL' | 'PERCENTAGE';
        
        // Safety check to ensure percentage max 100 on Client-Side
        if (discountType === 'PERCENTAGE' && discountValue > 100) {
            discountValue = 100;
        }

        const data = {
            code: formData.get('code'),
            name: formData.get('name'),
            discountType,
            discountValue,
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            isActive: formData.get('isActive') === 'true',
        };

        onSubmit(data);
    };

    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        // Konversi ISO string ("2026-03-24T00:00:00.000Z") menjadi "2026-03-24T00:00" untuk input datetime-local
        const date = new Date(dateString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{initialData ? 'Ubah Voucher' : 'Tambah Voucher'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Kode Voucher <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="code"
                            className="form-input"
                            defaultValue={initialData?.code}
                            placeholder="Contoh: PROMO2026"
                            required
                            minLength={3}
                            maxLength={50}
                            style={{ textTransform: 'uppercase' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nama Voucher <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            defaultValue={initialData?.name}
                            placeholder="Deskripsi internal (contoh: Promo Diskon Lebaran)"
                            required
                            minLength={3}
                            maxLength={150}
                        />
                    </div>

                    <div className="form-group grid grid-2">
                        <div>
                            <label className="form-label">Jenis Diskon</label>
                            <select 
                                name="discountType" 
                                className="form-control" 
                                defaultValue={initialData?.discountType || 'NOMINAL'}
                            >
                                <option value="NOMINAL">Nominal (Rp)</option>
                                <option value="PERCENTAGE">Persentase (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Nilai Diskon <span className="text-danger">*</span></label>
                            <input
                                type="number"
                                name="discountValue"
                                className="form-input"
                                defaultValue={initialData?.discountValue}
                                placeholder="0"
                                required
                                min={1}
                                step="any"
                            />
                        </div>
                    </div>

                    <div className="form-group grid grid-2">
                        <div>
                            <label className="form-label">Mulai Tanggal <span className="text-danger">*</span></label>
                            <input
                                type="datetime-local"
                                name="startDate"
                                className="form-input"
                                defaultValue={formatDateForInput(initialData?.startDate)}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Berakhir Tanggal <span className="text-danger">*</span></label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                className="form-input"
                                defaultValue={formatDateForInput(initialData?.endDate)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status Voucher</label>
                        <select 
                            name="isActive" 
                            className="form-control" 
                            defaultValue={initialData ? String(initialData.isActive) : 'true'}
                        >
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                        </select>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Simpan Voucher
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
