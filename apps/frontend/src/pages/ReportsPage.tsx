import { useState, useEffect } from 'react';
import {
    useSalesSummary,
    useProductPerformance,
    useInventoryValuation,
    useStockAlerts,
} from '../hooks/useReports';
import { useConfigurationByKey } from '../hooks/useConfiguration';
import { formatCurrency } from '../utils/currency';

const STOCK_ALERT_KEY = 'stock_alert_threshold';
const DEFAULT_THRESHOLD = 5;

export const ReportsPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset page on new search term
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: summary, isLoading: summaryLoading } = useSalesSummary();
    const { data: performance, isLoading: performanceLoading } = useProductPerformance();
    const { data: valuation, isLoading: valuationLoading } = useInventoryValuation();

    // Baca threshold dari konfigurasi; gunakan default jika belum pernah di-set
    const { data: thresholdConfig } = useConfigurationByKey(STOCK_ALERT_KEY);
    const threshold = thresholdConfig ? parseInt(thresholdConfig.value, 10) : DEFAULT_THRESHOLD;

    const { data: stockAlertsData, isLoading: alertsLoading } = useStockAlerts({
        threshold,
        page,
        limit: 10,
        search: debouncedSearch,
    });

    // if (summaryLoading || performanceLoading || valuationLoading || alertsLoading) {
    //     return <div className="spinner"></div>;
    // }

    const stockAlerts = stockAlertsData?.data || [];
    const meta = stockAlertsData?.meta;
    const hasAlerts = stockAlerts.length > 0;

    return (
        <div>
            <h1>📈 Reports &amp; Analytics</h1>
            <p className="text-muted mb-4">Comprehensive business insights</p>

            {/* ===== STOCK ALERT SECTION ===== */}
            <div
                className="card mb-4"
                style={{
                    borderLeft: hasAlerts
                        ? '4px solid var(--danger)'
                        : '4px solid var(--success)',
                }}
            >
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 className="card-title">
                            {hasAlerts || search || (meta?.total ?? 0) > 0 ? '⚠️ Peringatan Stok Rendah' : '✅ Status Stok'}
                        </h3>
                        <span
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-muted)',
                            }}
                        >
                            Batas minimum: <strong>{threshold} unit</strong>
                        </span>
                    </div>
                    <div style={{ flex: '1 1 auto', maxWidth: '300px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Cari produk / variant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%' }}
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
                                            style={{
                                                background: isCritical
                                                    ? 'rgba(var(--danger-rgb, 220,53,69), 0.12)'
                                                    : 'rgba(var(--warning-rgb, 255,193,7), 0.08)',
                                            }}
                                        >
                                            <td style={{ fontWeight: 600 }}>{alert.productName}</td>
                                            <td>{alert.variantName}</td>
                                            <td>
                                                <code style={{ fontSize: '0.85em' }}>{alert.sku}</code>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        color: isCritical
                                                            ? 'var(--danger)'
                                                            : 'var(--warning)',
                                                    }}
                                                >
                                                    {alert.currentStock} unit
                                                </span>
                                            </td>
                                            <td>{alert.threshold} unit</td>
                                            <td className="text-danger" style={{ fontWeight: 600 }}>
                                                -{deficit} unit
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {meta && meta.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Menampilkan {meta.page} dari {meta.totalPages} halaman (Total: {meta.total} variant)
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={meta.page <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={meta.page >= meta.totalPages}
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-muted" style={{ padding: '1.5rem' }}>
                        {search ? (
                            <>❌ Tidak ada variant stok rendah yang cocok dengan pencarian "<strong>{search}</strong>"</>
                        ) : (
                            <>✅ Semua stok variant aman — tidak ada yang di bawah batas minimum ({threshold} unit)</>
                        )}
                    </p>
                )}
            </div>

            {/* ===== SALES SUMMARY ===== */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">💰 Sales Summary</h3>
                </div>
                <div className="grid grid-2">
                    <div>
                        <p className="text-muted">Total Sales</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                            {summary ? formatCurrency(summary.totalSales) : formatCurrency(0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted">Total Profit</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>
                            {summary ? formatCurrency(summary.totalProfit) : formatCurrency(0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted">Total COGS</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                            {summary ? formatCurrency(summary.totalCogs) : formatCurrency(0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted">Profit Margin</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                            {summary?.profitMargin.toFixed(2) || '0'}%
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== PRODUCT PERFORMANCE ===== */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">🏆 Product Performance</h3>
                </div>
                {performance && performance.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty Sold</th>
                                    <th>Revenue</th>
                                    <th>COGS</th>
                                    <th>Profit</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performance.map((item) => (
                                    <tr key={item.productId}>
                                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                                        <td>{item.totalQuantitySold}</td>
                                        <td className="text-success">{formatCurrency(item.totalRevenue)}</td>
                                        <td className="text-danger">{formatCurrency(item.totalCogs)}</td>
                                        <td className="text-primary-light" style={{ fontWeight: 600 }}>
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
                    <p className="text-center text-muted">No sales data available</p>
                )}
            </div>

            {/* ===== INVENTORY VALUATION ===== */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📦 Inventory Valuation</h3>
                </div>
                {valuation && valuation.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Current Stock</th>
                                    <th>Avg Cost Price</th>
                                    <th>Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {valuation.map((item) => (
                                    <tr key={item.productId}>
                                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                                        <td>{item.currentStock} units</td>
                                        <td>{formatCurrency(item.averageCostPrice)}</td>
                                        <td className="text-warning" style={{ fontWeight: 600 }}>
                                            {formatCurrency(item.totalValue)}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ background: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                                    <td colSpan={3}>Total Inventory Value</td>
                                    <td className="text-warning">
                                        {formatCurrency(valuation.reduce((sum, item) => sum + item.totalValue, 0))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-muted">No inventory data available</p>
                )}
            </div>
        </div>
    );
};
