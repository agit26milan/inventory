import React, { useState, useEffect } from 'react';
import { useSalesTimeframe } from '../hooks/useReports';
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

export const SalesReportPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page when searching
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const { data: reportData, isLoading } = useSalesTimeframe({
        page,
        limit: 10,
        search: debouncedSearch,
    });

    if (isLoading) {
        return <div className="spinner"></div>;
    }

    const data = reportData?.data || [];
    const meta = reportData?.meta;

    // Custom Tooltip for Recharts
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

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Bar Chart Penjualan (Unit)</h3>
                </div>
                
                {data.length > 0 ? (
                    <div style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
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
                                    
                                    {/* Emerald color for 1 Day */}
                                    <Bar dataKey="sold1Day" name="1 Hari Terakhir" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    {/* Indigo color for 7 Days */}
                                    <Bar dataKey="sold7Days" name="7 Hari Terakhir" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                    {/* Amber color for 30 Days */}
                                    <Bar dataKey="sold30Days" name="30 Hari Terakhir" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pagination Controls */}
                        {meta && meta.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Halaman {meta.page} dari {meta.totalPages} (Total: {meta.total} produk)
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
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {search ? (
                            <p>Tidak ada produk yang cocok dengan pencarian "<strong>{search}</strong>"</p>
                        ) : (
                            <p>Belum ada data produk untuk ditampilkan.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesReportPage;
