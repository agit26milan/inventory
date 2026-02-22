import { useState, useEffect } from 'react';
import { useConfigurationByKey, useUpsertConfiguration } from '../../hooks/useConfiguration';

const STOCK_ALERT_KEY = 'stock_alert_threshold';

export const ConfigurationPage = () => {
    const { data: config, isLoading } = useConfigurationByKey(STOCK_ALERT_KEY);
    const { mutate: upsert, isPending, isSuccess, isError } = useUpsertConfiguration();

    // State lokal untuk input; diinisialisasi dari data config yang ter-fetch
    const [threshold, setThreshold] = useState<string>('5');

    // Sinkronkan state lokal ketika data config berhasil di-fetch
    useEffect(() => {
        if (config?.value) {
            setThreshold(config.value);
        }
    }, [config]);

    const handleSave = () => {
        const numericValue = parseInt(threshold, 10);
        if (isNaN(numericValue) || numericValue < 1) return;

        upsert({
            key: STOCK_ALERT_KEY,
            value: String(numericValue),
            description: 'Jumlah minimum stok variant sebelum memunculkan peringatan di halaman Reports',
        });
    };

    return (
        <div>
            <h1>⚙️ Konfigurasi</h1>
            <p className="text-muted mb-4">Pengaturan umum aplikasi inventory</p>

            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">📦 Peringatan Stok Minimum</h3>
                </div>

                {isLoading ? (
                    <div className="spinner"></div>
                ) : (
                    <div style={{ padding: '1.5rem' }}>
                        <p className="text-muted mb-4">
                            Tentukan batas minimum stok variant. Jika stok sebuah variant berada
                            di bawah angka ini, sistem akan memunculkan peringatan di halaman
                            <strong> Reports</strong>.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label
                                    htmlFor="stock-threshold"
                                    style={{ fontWeight: 600, fontSize: '0.9rem' }}
                                >
                                    Batas minimum stok (unit)
                                </label>
                                <input
                                    id="stock-threshold"
                                    type="number"
                                    min={1}
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                    style={{ width: '140px' }}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={isPending}
                                style={{ alignSelf: 'flex-end' }}
                            >
                                {isPending ? 'Menyimpan...' : '💾 Simpan'}
                            </button>
                        </div>

                        {/* Feedback pesan sukses / error */}
                        {isSuccess && (
                            <p
                                style={{
                                    marginTop: '1rem',
                                    color: 'var(--success)',
                                    fontWeight: 600,
                                }}
                            >
                                ✅ Konfigurasi berhasil disimpan!
                            </p>
                        )}
                        {isError && (
                            <p
                                style={{
                                    marginTop: '1rem',
                                    color: 'var(--danger)',
                                    fontWeight: 600,
                                }}
                            >
                                ❌ Gagal menyimpan konfigurasi. Silakan coba lagi.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
