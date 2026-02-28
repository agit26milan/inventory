import { useSalesSummary, useInventoryValuation } from '../../hooks/useReports';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/currency';

export const DashboardPage = () => {
  const { data: summary, isLoading: summaryLoading } = useSalesSummary();
  const { data: valuation, isLoading: valuationLoading } = useInventoryValuation();
  const { data: products, isLoading: productsLoading } = useProducts();

  if (summaryLoading || valuationLoading || productsLoading) {
    return <div className="spinner"></div>;
  }

  const totalInventoryValue = valuation?.reduce((sum, item) => sum + item.totalValue, 0) || 0;

  return (
    <div>
      <h1>📊 Dasbor</h1>
      <p className="text-muted mb-4">Ringkasan sistem inventaris Anda</p>

      <div className="grid grid-3 mb-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💰 Total Penjualan</h3>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
              {summary ? formatCurrency(summary.totalSales) : formatCurrency(0)}
            </p>
            <p className="text-muted">{summary?.numberOfTransactions || 0} transaksi</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Total Laba Bersih</h3>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>
              {summary ? formatCurrency(summary.totalProfit) : formatCurrency(0)}
            </p>
            <p className="text-muted">Margin: {summary?.profitMargin.toFixed(1) || 0}%</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📦 Nilai Inventaris</h3>
          </div>
          <div className="text-center">
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
              {formatCurrency(totalInventoryValue)}
            </p>
            <p className="text-muted">{products?.length || 0} produk</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Statistik Singkat</h3>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-muted">Total HPP (COGS):</span>
              <span className="text-danger">{summary ? formatCurrency(summary.totalCogs) : formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total Produk:</span>
              <span>{products?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
