import React, { useMemo } from 'react';
import { useSalesSummary, useInventoryValuation } from '../../hooks/useReports';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/currency';
import styles from './styles.module.css';

export const DashboardPage: React.FC = (): JSX.Element => {
  const { data: summary, isLoading: summaryLoading } = useSalesSummary();
  const { data: valuation, isLoading: valuationLoading } = useInventoryValuation();
  const { data: products, isLoading: productsLoading } = useProducts();

  // Kalkulasi total nilai inventaris, di-memoize untuk menghindari re-render yang tidak perlu (Best Practice Meta)
  const totalInventoryValue = useMemo<number>(() => {
    if (!valuation) return 0;
    return valuation.reduce((sum, item) => sum + item.totalValue, 0);
  }, [valuation]);

  if (summaryLoading || valuationLoading || productsLoading) {
    return <div className="spinner"></div>;
  }

  const totalSalesFormatted = summary ? formatCurrency(summary.totalSales) : formatCurrency(0);
  const totalProfitFormatted = summary ? formatCurrency(summary.totalProfit) : formatCurrency(0);
  const totalCogsFormatted = summary ? formatCurrency(summary.totalCogs) : formatCurrency(0);
  
  const transactionsCount = summary?.numberOfTransactions || 0;
  const profitMargin = summary?.profitMargin.toFixed(1) || 0;
  const productsCount = products?.length || 0;

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
            <p className={styles['dp-stat--sales']}>
              {totalSalesFormatted}
            </p>
            <p className="text-muted">{transactionsCount} transaksi</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Total Laba Bersih</h3>
          </div>
          <div className="text-center">
            <p className={styles['dp-stat--profit']}>
              {totalProfitFormatted}
            </p>
            <p className="text-muted">Margin: {profitMargin}%</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📦 Nilai Inventaris</h3>
          </div>
          <div className="text-center">
            <p className={styles['dp-stat--inventory']}>
              {formatCurrency(totalInventoryValue)}
            </p>
            <p className="text-muted">{productsCount} produk</p>
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
              <span className="text-danger">{totalCogsFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total Produk:</span>
              <span>{productsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
