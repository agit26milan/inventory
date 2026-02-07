import {
  useSalesSummary,
  useProductPerformance,
  useInventoryValuation,
} from '../hooks/useReports';

export const ReportsPage = () => {
  const { data: summary, isLoading: summaryLoading } = useSalesSummary();
  const { data: performance, isLoading: performanceLoading } = useProductPerformance();
  const { data: valuation, isLoading: valuationLoading } = useInventoryValuation();

  if (summaryLoading || performanceLoading || valuationLoading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <h1>📈 Reports & Analytics</h1>
      <p className="text-muted mb-4">Comprehensive business insights</p>

      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">💰 Sales Summary</h3>
        </div>
        <div className="grid grid-2">
          <div>
            <p className="text-muted">Total Sales</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
              ${summary?.totalSales.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-muted">Total Profit</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>
              ${summary?.totalProfit.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-muted">Total COGS</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              ${summary?.totalCogs.toFixed(2) || '0.00'}
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
                    <td className="text-success">${item.totalRevenue.toFixed(2)}</td>
                    <td className="text-danger">${item.totalCogs.toFixed(2)}</td>
                    <td className="text-primary-light" style={{ fontWeight: 600 }}>
                      ${item.totalProfit.toFixed(2)}
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
                    <td>${item.averageCostPrice.toFixed(2)}</td>
                    <td className="text-warning" style={{ fontWeight: 600 }}>
                      ${item.totalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                  <td colSpan={3}>Total Inventory Value</td>
                  <td className="text-warning">
                    ${valuation.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)}
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
