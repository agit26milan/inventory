import React, { useState, useEffect } from 'react';
import { useSalesTimeframe, useAnnualSales, useMonthlyProfit } from '../../hooks/useReports';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import './style.css';

type ReportTab = 'timeframe' | 'annual' | 'profit';

export const SalesReportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>('timeframe');

    // Shared filters
    const [search] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [timeframePage, setTimeframePage] = useState(1);
    const [annualPage, setAnnualPage] = useState(1);

    // Annual specific filters
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth] = useState<number | 'all'>('all');

    // State filter tahun untuk chart laba bulanan (mulai dari 2026)
    const PROFIT_START_YEAR = 2026;
    const [profitYear, setProfitYear] = useState<number>(currentYear);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setTimeframePage(1);
            setAnnualPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Data fetching
    const { data: timeframeReportData } = useSalesTimeframe({
        page: timeframePage,
        limit: 10,
        search: debouncedSearch,
    });

    const { data: annualReportData } = useAnnualSales({
        year: selectedYear,
        month: selectedMonth === 'all' ? undefined : selectedMonth,
        page: annualPage,
        limit: 10,
        search: debouncedSearch,
    });

    // Data laba bulanan — di-fetch ulang otomatis setiap profitYear berubah
    const { data: monthlyProfitData } = useMonthlyProfit(profitYear);

    const timeframeData = timeframeReportData?.data || [];
    const timeframeMeta = timeframeReportData?.meta;

    const annualData = annualReportData?.data || [];
    const annualMeta = annualReportData?.meta;

    // ─── Custom Tooltip (Timeframe & Annual) ──────────────────────────────────
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Menghitung total semua produk yang terjual (khusus tab tahunan)
            const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

            return (
                <div className="srp-tooltip">
                    <p className="srp-tooltip__title">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p
                            key={`item-${index}`}
                            className="srp-tooltip__item"
                            style={{ color: entry.color }}
                        >
                            {entry.name}: <strong>{entry.value} unit</strong>
                        </p>
                    ))}
                    {/* Menampilkan total hanya untuk chart tahunan / bulanan */}
                    {activeTab === 'annual' && (
                        <>
                            <hr className="srp-tooltip__divider" />
                            <p className="srp-tooltip__total">
                                Total Penjualan: <strong>{total} unit</strong>
                            </p>
                        </>
                    )}
                </div>
            );
        }
        return null;
    };

    // ─── TAB: TIMEFRAME ───────────────────────────────────────────────────────
    const renderTimeframeTab = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Bar Chart Penjualan (Unit) - Timeframe</h3>
            </div>

            {timeframeData.length > 0 ? (
                <div className="srp-chart-body">
                    <div className="srp-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={timeframeData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="productName"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                <Bar dataKey="sold1Day" name="1 Hari Terakhir" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="sold7Days" name="7 Hari Terakhir" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="sold30Days" name="30 Hari Terakhir" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {timeframeMeta && timeframeMeta.totalPages > 1 && (
                        <div className="srp-pagination">
                            <span className="text-muted srp-pagination__info">
                                Halaman {timeframeMeta.page} dari {timeframeMeta.totalPages} (Total: {timeframeMeta.total} produk)
                            </span>
                            <div className="srp-pagination__controls">
                                <button
                                    className="btn btn-secondary srp-pagination__btn"
                                    disabled={timeframeMeta.page <= 1}
                                    onClick={() => setTimeframePage(p => Math.max(1, p - 1))}
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    className="btn btn-secondary srp-pagination__btn"
                                    disabled={timeframeMeta.page >= timeframeMeta.totalPages}
                                    onClick={() => setTimeframePage(p => Math.min(timeframeMeta.totalPages, p + 1))}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="srp-empty">
                    {search ? (
                        <p>Tidak ada produk yang cocok dengan pencarian "<strong>{search}</strong>"</p>
                    ) : (
                        <p>Belum ada data produk untuk ditampilkan.</p>
                    )}
                </div>
            )}
        </div>
    );

    // ─── TAB: PENJUALAN BULANAN (ANNUAL) ──────────────────────────────────────
    // Transforming backend Annual Data for Recharts:
    // Tampilkan bulan di sumbu X, setiap batang mewakili jumlah terjual per produk per bulan.
    const prepareAnnualChartData = () => {
        if (!annualData || annualData.length === 0) return [];

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return months.map((monthName, index) => {
            const monthObj: any = { month: monthName };
            annualData.forEach((product: any) => {
                // index + 1 maps to month 1-12
                const monthData = product.monthlyData.find((m: any) => m.month === index + 1);
                monthObj[product.productName] = monthData ? monthData.totalQuantity : 0;
            });
            return monthObj;
        });
    };

    const annualChartData = prepareAnnualChartData();
    // Use stable predefined colors for up to 10 products on the screen
    const productColors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#64748B'];

    const renderAnnualTab = () => (
        <div className="card">
            <div className="card-header srp-annual-header">
                <h3 className="card-title">Bar Chart Penjualan (Unit) - Tahunan</h3>
                <div className="srp-annual-filters">
                    <select
                        className="form-control srp-annual-year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {annualData.length > 0 ? (
                <div className="srp-chart-body">
                    <div className="srp-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={annualChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                {annualData.map((product: any, index: number) => (
                                    <Bar
                                        key={product.productId}
                                        dataKey={product.productName}
                                        name={product.productName}
                                        fill={productColors[index % productColors.length]}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {annualMeta && annualMeta.totalPages > 1 && (
                        <div className="srp-pagination">
                            <span className="text-muted srp-pagination__info">
                                Halaman {annualMeta.page} dari {annualMeta.totalPages} (Total: {annualMeta.total} produk)
                            </span>
                            <div className="srp-pagination__controls">
                                <button
                                    className="btn btn-secondary srp-pagination__btn"
                                    disabled={annualMeta.page <= 1}
                                    onClick={() => setAnnualPage(p => Math.max(1, p - 1))}
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    className="btn btn-secondary srp-pagination__btn"
                                    disabled={annualMeta.page >= annualMeta.totalPages}
                                    onClick={() => setAnnualPage(p => Math.min(annualMeta.totalPages, p + 1))}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="srp-empty">
                    {search ? (
                        <p>Tidak ada produk yang cocok dengan pencarian "<strong>{search}</strong>"</p>
                    ) : (
                        <p>Belum ada performa penjualan untuk kriteria terpilih.</p>
                    )}
                </div>
            )}
        </div>
    );

    // ─── TAB: LABA BULANAN ────────────────────────────────────────────────────
    // Mapping index bulan (0–11) ke nama singkat bahasa Indonesia
    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const profitChartData = (monthlyProfitData?.data ?? []).map((d) => ({
        month: MONTH_LABELS[d.month - 1],
        totalRevenue: d.totalRevenue,
        totalProfit: d.totalProfit,
    }));

    // Daftar tahun filter dimulai dari PROFIT_START_YEAR hingga tahun saat ini
    const profitYearOptions = Array.from(
        { length: Math.max(1, currentYear - PROFIT_START_YEAR + 1) },
        (_, i) => PROFIT_START_YEAR + i
    );

    // Helper: format angka ke mata uang Rupiah
    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(value);

    // Helper: ringkas angka besar untuk sumbu Y
    const formatYAxis = (value: number) => {
        if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
        if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
        return `Rp ${value}`;
    };

    /**
     * Tooltip kustom untuk chart laba:
     * - Laba Kotor (totalRevenue)
     * - Laba Bersih (totalProfit)
     * - Persentase laba bersih dibanding laba kotor
     */
    const ProfitTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;

        // Cari masing-masing nilai berdasarkan dataKey untuk keamanan urutan
        const revenue: number = payload.find((p: any) => p.dataKey === 'totalRevenue')?.value ?? 0;
        const profit: number = payload.find((p: any) => p.dataKey === 'totalProfit')?.value ?? 0;
        // Hitung margin persen laba bersih terhadap laba kotor
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

        return (
            <div className="profit-tooltip">
                <p className="profit-tooltip__label">{label}</p>
                <p className="profit-tooltip__row" style={{ color: '#10B981' }}>
                    Laba Kotor: <strong>{formatRupiah(revenue)}</strong>
                </p>
                <p className="profit-tooltip__row" style={{ color: '#6366F1' }}>
                    Laba Bersih: <strong>{formatRupiah(profit)}</strong>
                </p>
                <hr className="profit-tooltip__divider" />
                <p className="profit-tooltip__margin">
                    Margin Laba Bersih: <strong>{margin}%</strong>
                </p>
            </div>
        );
    };

    const renderProfitTab = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Laba Kotor vs Laba Bersih — Bulanan (Rp)</h3>
                <div className="profit-filter-row">
                    <label htmlFor="profit-year-select" className="profit-filter-label">Tahun:</label>
                    <select
                        id="profit-year-select"
                        className="form-control profit-year-select"
                        value={profitYear}
                        onChange={(e) => setProfitYear(Number(e.target.value))}
                    >
                        {profitYearOptions.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="profit-chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={profitChartData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        barCategoryGap="20%"
                        barGap={4}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: '#cbd5e1' }}
                            width={95}
                        />
                        <Tooltip content={<ProfitTooltip />} cursor={{ fill: 'rgba(226,232,240,0.4)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {/* Laba Kotor — hijau */}
                        <Bar
                            dataKey="totalRevenue"
                            name="Laba Kotor"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                        />
                        {/* Laba Bersih — indigo */}
                        <Bar
                            dataKey="totalProfit"
                            name="Laba Bersih"
                            fill="#6366F1"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div>
            <div className="srp-header">
                <div>
                    <h1>📈 Sales Report</h1>
                    <p className="text-muted srp-header__subtitle">Product sales performance over time</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="report-tab-row">
                <button
                    className={`btn ${activeTab === 'timeframe' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('timeframe')}
                >
                    1 Hari / 7 Hari / 30 Hari
                </button>
                <button
                    className={`btn ${activeTab === 'annual' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('annual')}
                >
                    Penjualan Bulanan
                </button>
                <button
                    className={`btn ${activeTab === 'profit' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('profit')}
                >
                    Laba Bulanan
                </button>
            </div>

            {activeTab === 'timeframe' && renderTimeframeTab()}
            {activeTab === 'annual' && renderAnnualTab()}
            {activeTab === 'profit' && renderProfitTab()}
        </div>
    );
};

export default SalesReportPage;
