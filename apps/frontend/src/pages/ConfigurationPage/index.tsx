import { useState, useEffect } from 'react';
import { useConfigurationByKey, useUpsertConfiguration } from '../../hooks/useConfiguration';
import './styles.css';

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
                    <div className="cp-card-body">
                        <p className="text-muted mb-4">
                            Tentukan batas minimum stok variant. Jika stok sebuah variant berada
                            di bawah angka ini, sistem akan memunculkan peringatan di halaman
                            <strong> Reports</strong>.
                        </p>

                        <div className="cp-input-row">
                            <div className="cp-input-col">
                                <label
                                    htmlFor="stock-threshold"
                                    className="cp-input-label"
                                >
                                    Batas minimum stok (unit)
                                </label>
                                <input
                                    id="stock-threshold"
                                    type="number"
                                    min={1}
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                    className="cp-threshold-input"
                                />
                            </div>

                            <button
                                className="btn btn-primary cp-save-btn"
                                onClick={handleSave}
                                disabled={isPending}
                            >
                                {isPending ? 'Menyimpan...' : '💾 Simpan'}
                            </button>
                        </div>

                        {/* Feedback pesan sukses / error */}
                        {isSuccess && (
                            <p className="cp-feedback--success">
                                ✅ Konfigurasi berhasil disimpan!
                            </p>
                        )}
                        {isError && (
                            <p className="cp-feedback--error">
                                ❌ Gagal menyimpan konfigurasi. Silakan coba lagi.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
