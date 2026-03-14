import { useState, useEffect } from 'react';
import { useSalesSummary, useProductPerformance, useInventoryValuation, useStockAlerts, useVariantPerformance } from '../../hooks/useReports';
import { useConfigurationByKey } from '../../hooks/useConfiguration';
import { useTotalEquity } from '../../hooks/useEquity';
import { useTotalExpenses } from '../../hooks/useStoreExpense';
import { formatCurrency } from '../../utils/currency';
import './styles.css';

const STOCK_ALERT_KEY = 'stock_alert_threshold';
const DEFAULT_THRESHOLD = 5;

export const ReportsPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [variantPage, setVariantPage] = useState(1);
    const [variantSearchProduct, setVariantSearchProduct] = useState('');
    const [variantSearchVariant, setVariantSearchVariant] = useState('');
    const [debouncedVariantProduct, setDebouncedVariantProduct] = useState('');
    const [debouncedVariantVariant, setDebouncedVariantVariant] = useState('');
    const [variantStockSort, setVariantStockSort] = useState<'asc' | 'desc' | undefined>(undefined);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset page on new search term
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Debounce untuk search Variant Performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedVariantProduct(variantSearchProduct);
            setDebouncedVariantVariant(variantSearchVariant);
            setVariantPage(1); // Reset ke halaman 1 saat search berubah
        }, 500);
        return () => clearTimeout(timer);
    }, [variantSearchProduct, variantSearchVariant]);

    const { data: summary } = useSalesSummary();
    const { data: performance } = useProductPerformance();
    const { data: valuation } = useInventoryValuation();
    const { data: totalEquity } = useTotalEquity();
    const { data: totalExpenses } = useTotalExpenses();

    // Kalkulasi Total Modal + Inventory
    const ekuitasBersih = (totalEquity || 0) - (totalExpenses || 0);
    const totalNilaiInventory = valuation?.reduce((sum, item) => sum + Number(item.totalValue), 0) || 0;
    const modalPlusInventory = ekuitasBersih + totalNilaiInventory;
    const { data: variantPerfData } = useVariantPerformance(
        variantPage,
        10,
        debouncedVariantProduct || undefined,
        debouncedVariantVariant || undefined,
        variantStockSort
    );

    // Baca threshold dari konfigurasi; gunakan default jika belum pernah di-set
    const { data: thresholdConfig } = useConfigurationByKey(STOCK_ALERT_KEY);
    const threshold = thresholdConfig ? parseInt(thresholdConfig.value, 10) : DEFAULT_THRESHOLD;

    const { data: stockAlertsData } = useStockAlerts({
        threshold,
        page,
        limit: 10,
        search: debouncedSearch,
    });

    const stockAlerts = stockAlertsData?.data || [];
    const meta = stockAlertsData?.meta;
    const hasAlerts = stockAlerts.length > 0;

    return (
        <div>
            <h1>📈 Laporan &amp; Analitik</h1>
            <p className="text-muted mb-4">Wawasan bisnis secara menyeluruh</p>

               {/* ===== SALES SUMMARY ===== */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">💰 Ringkasan Penjualan</h3>
                </div>
                <div className="grid grid-3">
                    <div>
                        <p className="text-muted">Total Penjualan</p>
                        <p className="rp-summary-total-sales">
                            {summary ? formatCurrency(summary.totalSales) : formatCurrency(0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted">Total Keuntungan</p>
                        <p className="rp-summary-total-profit">
                            {summary ? formatCurrency(summary.totalProfit) : formatCurrency(0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted">Total HPP</p>
                        <p className="rp-summary-total-cogs">
                            {summary ? formatCurrency(summary.totalCogs) : formatCurrency(0)}
                        </p>
                    </div>
                            <div>
                        <p className="text-muted">Margin Keuntungan</p>
                        <p className="rp-summary-margin">
                            {summary?.profitMargin.toFixed(2) || '0'}%
                        </p>
                    </div>
                    <div>
                        <p className="text-muted">Modal + Inventory</p>
                        <p className="rp-summary-modal-inventory">
                            {formatCurrency(modalPlusInventory)}
                        </p>
                    </div>
                </div>
            </div>

             {/* ===== VARIANT PERFORMANCE ===== */}
            <div className="card mb-4">
                <div className="card-header rp-variant-header">
                    <h3 className="card-title">📊 Performa Varian</h3>
                    <div className="rp-variant-filters">
                        <input
                            type="text"
                            className="form-control rp-variant-search-product"
                            placeholder="Cari produk..."
                            value={variantSearchProduct}
                            onChange={(e) => setVariantSearchProduct(e.target.value)}
                        />
                        <input
                            type="text"
                            className="form-control rp-variant-search-variant"
                            placeholder="Cari variant / SKU..."
                            value={variantSearchVariant}
                            onChange={(e) => setVariantSearchVariant(e.target.value)}
                        />
                        <select
                            className="form-control rp-variant-sort-select"
                            value={variantStockSort ?? ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Reset ke halaman 1 saat urutan diganti
                                setVariantPage(1);
                                setVariantStockSort(val === 'asc' || val === 'desc' ? val : undefined);
                            }}
                        >
                            <option value="">Urutkan Stok (Default)</option>
                            <option value="asc">⬆ Stok Terendah</option>
                            <option value="desc">⬇ Stok Tertinggi</option>
                        </select>
                    </div>
                </div>
                {variantPerfData?.data && variantPerfData.data.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Varian</th>
                                    <th>SKU</th>
                                    <th>Qty Terjual</th>
                                    <th>Stok Tersisa</th>
                                    <th>Pendapatan</th>
                                    <th>HPP</th>
                                    <th>Keuntungan</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variantPerfData.data.map((item) => {
                                    // Tentukan class stok berdasarkan jumlah
                                    const stockClass =
                                        item.remainingQuantity === 0
                                            ? 'rp-variant-stock--empty'
                                            : item.remainingQuantity <= 2
                                                ? 'rp-variant-stock--low'
                                                : 'rp-variant-stock';

                                    return (
                                        <tr key={`${item.productId}-${item.combinationId || 'base'}`}>
                                            <td className="rp-variant-product-name">{item.productName}</td>
                                            <td>{item.variantName}</td>
                                            <td><code style={{ fontSize: '0.85em' }}>{item.sku}</code></td>
                                            <td>{item.totalQuantitySold}</td>
                                            <td>
                                                <span className={stockClass}>
                                                    {item.remainingQuantity} unit
                                                </span>
                                            </td>
                                            <td className="text-success">{formatCurrency(item.totalRevenue)}</td>
                                            <td className="text-danger">{formatCurrency(item.totalCogs)}</td>
                                            <td className="text-primary-light rp-variant-profit">
                                                {formatCurrency(item.totalProfit)}
                                            </td>
                                            <td>
                                                {item.totalRevenue > 0 ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1) : '0.0'}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {variantPerfData.meta && variantPerfData.meta.totalPages > 1 && (
                            <div className="rp-pagination">
                                <span className="text-muted rp-pagination__info">
                                    Menampilkan {variantPerfData.meta.page} dari {variantPerfData.meta.totalPages} halaman (Total: {variantPerfData.meta.total} variant)
                                </span>
                                <div className="rp-pagination__controls">
                                    <button
                                        className="btn btn-secondary btn-sm rp-pagination__btn"
                                        disabled={variantPerfData.meta.page <= 1}
                                        onClick={() => setVariantPage(p => Math.max(1, p - 1))}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm rp-pagination__btn"
                                        disabled={variantPerfData.meta.page >= variantPerfData.meta.totalPages}
                                        onClick={() => setVariantPage(p => Math.min(variantPerfData.meta.totalPages, p + 1))}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="rp-empty text-muted">Belum ada data performa varian</p>
                )}
            </div>

            {/* ===== STOCK ALERT SECTION ===== */}
            <div
                className="card mb-4"
                style={{
                    borderLeft: hasAlerts
                        ? '4px solid var(--danger)'
                        : '4px solid var(--success)',
                }}
            >
                <div className="card-header rp-alert-header">
                    <div>
                        <h3 className="card-title">
                            {hasAlerts || search || (meta?.total ?? 0) > 0 ? '⚠️ Peringatan Stok Rendah' : '✅ Status Stok'}
                        </h3>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Batas minimum: <strong>{threshold} unit</strong>
                        </span>
                    </div>
                    <div className="rp-alert-search">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Cari produk / variant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {hasAlerts ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Variant</th>
                                    <th>SKU</th>
                                    <th>Stok Saat Ini</th>
                                    <th>Batas Minimum</th>
                                    <th>Selisih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockAlerts.map((alert) => {
                                    // Hitung kekurangan stok dari batas minimum
                                    const deficit = alert.threshold - alert.currentStock;
                                    const isCritical = alert.currentStock === 0;

                                    return (
                                        <tr
                                            key={alert.combinationId}
                                            className={isCritical ? 'rp-alert-row--critical' : 'rp-alert-row--warning'}
                                        >
                                            <td className="rp-alert-product-name">{alert.productName}</td>
                                            <td>{alert.variantName}</td>
                                            <td>
                                                <code style={{ fontSize: '0.85em' }}>{alert.sku}</code>
                                            </td>
                                            <td>
                                                <span className={`rp-alert-stock ${isCritical ? 'rp-alert-stock--critical' : 'rp-alert-stock--warning'}`}>
                                                    {alert.currentStock} unit
                                                </span>
                                            </td>
                                            <td>{alert.threshold} unit</td>
                                            <td className="text-danger rp-alert-deficit">
                                                -{deficit} unit
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {meta && meta.totalPages > 1 && (
                            <div className="rp-pagination">
                                <span className="text-muted rp-pagination__info">
                                    Menampilkan {meta.page} dari {meta.totalPages} halaman (Total: {meta.total} variant)
                                </span>
                                <div className="rp-pagination__controls">
                                    <button
                                        className="btn btn-secondary btn-sm rp-pagination__btn"
                                        disabled={meta.page <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm rp-pagination__btn"
                                        disabled={meta.page >= meta.totalPages}
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="rp-empty text-muted">
                        {search ? (
                            <>❌ Tidak ada variant stok rendah yang cocok dengan pencarian &quot;<strong>{search}</strong>&quot;</>
                        ) : (
                            <>✅ Semua stok variant aman — tidak ada yang di bawah batas minimum ({threshold} unit)</>
                        )}
                    </p>
                )}
            </div>

         

            {/* ===== PRODUCT PERFORMANCE ===== */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">🏆 Performa Produk</h3>
                </div>
                {performance && performance.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Qty Terjual</th>
                                    <th>Pendapatan</th>
                                    <th>HPP</th>
                                    <th>Keuntungan</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performance.map((item) => (
                                    <tr key={item.productId}>
                                        <td className="rp-product-name">{item.productName}</td>
                                        <td>{item.totalQuantitySold}</td>
                                        <td className="text-success">{formatCurrency(item.totalRevenue)}</td>
                                        <td className="text-danger">{formatCurrency(item.totalCogs)}</td>
                                        <td className="text-primary-light rp-product-profit">
                                            {formatCurrency(item.totalProfit)}
                                        </td>
                                        <td>
                                            {((item.totalProfit / item.totalRevenue) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="rp-empty text-muted">Belum ada data penjualan</p>
                )}
            </div>

           

            {/* ===== INVENTORY VALUATION ===== */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📦 Valuasi Inventori</h3>
                </div>
                {valuation && valuation.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Stok Saat Ini</th>
                                    <th>Rata-rata HPP</th>
                                    <th>Total Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {valuation.map((item) => (
                                    <tr key={item.productId}>
                                        <td className="rp-valuation-product-name">{item.productName}</td>
                                        <td>{item.currentStock} unit</td>
                                        <td>{formatCurrency(item.averageCostPrice)}</td>
                                        <td className="text-warning rp-valuation-total-value">
                                            {formatCurrency(item.totalValue)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="rp-valuation-summary-row">
                                    <td colSpan={3}>Total Nilai Inventori</td>
                                    <td className="text-warning">
                                        {formatCurrency(valuation.reduce((sum, item: any) => sum + item.totalValue, 0))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="rp-empty text-muted">Belum ada data inventori</p>
                )}
            </div>
        </div>
    );
};
