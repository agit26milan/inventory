import React, { useState, useEffect } from 'react';
import { useSalesTimeframe, useAnnualSales } from '../../hooks/useReports';
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

type ReportTab = 'timeframe' | 'annual';

export const SalesReportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>('timeframe');
    
    // Shared filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [timeframePage, setTimeframePage] = useState(1);
    const [annualPage, setAnnualPage] = useState(1);

    // Annual specific filters
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

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

    const timeframeData = timeframeReportData?.data || [];
    const timeframeMeta = timeframeReportData?.meta;

    const annualData = annualReportData?.data || [];
    const annualMeta = annualReportData?.meta;

    // Custom Tooltip based on active tab
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ fontWeight: 600, marginBottom: '5px', color: '#333' }}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={`item-${index}`} style={{ color: entry.color, margin: 0, fontSize: '0.9rem' }}>
                            {entry.name}: <strong>{entry.value} unit</strong>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderTimeframeTab = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Bar Chart Penjualan (Unit) - Timeframe</h3>
            </div>
            
            {timeframeData.length > 0 ? (
                <div style={{ padding: '1rem' }}>
                    <div style={{ width: '100%', height: '400px' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                Halaman {timeframeMeta.page} dari {timeframeMeta.totalPages} (Total: {timeframeMeta.total} produk)
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={timeframeMeta.page <= 1}
                                    onClick={() => setTimeframePage(p => Math.max(1, p - 1))}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={timeframeMeta.page >= timeframeMeta.totalPages}
                                    onClick={() => setTimeframePage(p => Math.min(timeframeMeta.totalPages, p + 1))}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {search ? (
                        <p>Tidak ada produk yang cocok dengan pencarian "<strong>{search}</strong>"</p>
                    ) : (
                        <p>Belum ada data produk untuk ditampilkan.</p>
                    )}
                </div>
            )}
        </div>
    );

    // Transforming backend Annual Data for Recharts
    // If "All Months", display Months on X-Axis. 
    // To make it clear for multiple products, we'll average or sum it? 
    // Wait, the requirement was to display sales by month. 
    // A grouped bar chart with month on X-Axis and each bar represents a product's sales in that month.
    const prepareAnnualChartData = () => {
        if (!annualData || annualData.length === 0) return [];
        
        // Construct an array of 12 objects, one for each month
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const chartData = months.map((monthName, index) => {
            const monthObj: any = { month: monthName };
            // For each product, extract its sales quantity for this month
            annualData.forEach((product: any) => {
                // index + 1 maps to month 1-12
                const monthData = product.monthlyData.find((m: any) => m.month === index + 1);
                monthObj[product.productName] = monthData ? monthData.totalQuantity : 0;
            });
            return monthObj;
        });

        return chartData;
    };

    const annualChartData = prepareAnnualChartData();
    // Use stable predefined colors for up to 10 products on the screen
    const productColors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#64748B'];
    const renderAnnualTab = () => (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="card-title">Bar Chart Penjualan (Unit) - Tahunan</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select
                        className="form-control"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ width: '150px' }}
                    >
                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    {/* <select
                        className="form-control"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        style={{ width: '150px' }}
                    >
                        <option value="all">Semua Bulan</option>
                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month, index) => (
                            <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                    </select> */}
                </div>
            </div>
            
            {annualData.length > 0 ? (
                <div style={{ padding: '1rem' }}>
                    <div style={{ width: '100%', height: '400px' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                Halaman {annualMeta.page} dari {annualMeta.totalPages} (Total: {annualMeta.total} produk)
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={annualMeta.page <= 1}
                                    onClick={() => setAnnualPage(p => Math.max(1, p - 1))}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={annualMeta.page >= annualMeta.totalPages}
                                    onClick={() => setAnnualPage(p => Math.min(annualMeta.totalPages, p + 1))}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {search ? (
                        <p>Tidak ada produk yang cocok dengan pencarian "<strong>{search}</strong>"</p>
                    ) : (
                        <p>Belum ada performa penjualan untuk kriteria terpilih.</p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>📈 Sales Report</h1>
                    <p className="text-muted" style={{ margin: 0 }}>Product sales performance over time</p>
                </div>
                
                <div style={{ flex: '1 1 auto', maxWidth: '300px' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search product name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%' }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
                    Tahunan (Bulanan)
                </button>
            </div>

            {activeTab === 'timeframe' ? renderTimeframeTab() : renderAnnualTab()}
        </div>
    );
};

export default SalesReportPage;
