import { Link, useLocation } from 'react-router-dom';
import './Layout.css'; // Re-use layout styles for now

export const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">📦 Inventory</h2>
          <p className="sidebar-subtitle">FIFO & LIFO System</p>
        </div>

        <ul className="nav-menu">
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/products"
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            >
              <span className="nav-icon">📦</span>
              Products
            </Link>
          </li>
          <li>
            <Link
              to="/inventory"
              className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}
            >
              <span className="nav-icon">📥</span>
              Inventory
            </Link>
          </li>
          <li>
            <Link
              to="/sales"
              className={`nav-link ${isActive('/sales') ? 'active' : ''}`}
            >
              <span className="nav-icon">💰</span>
              Sales
            </Link>
          </li>
          <li>
            <Link
              to="/marketplace-fees"
              className={`nav-link ${isActive('/marketplace-fees') ? 'active' : ''}`}
            >
              <span className="nav-icon">🛒</span>
              Biaya Admin Shopee
            </Link>
          </li>
          <li>
            <Link
              to="/equity"
              className={`nav-link ${isActive('/equity') ? 'active' : ''}`}
            >
              <span className="nav-icon">💰</span>
              Equity
            </Link>
          </li>
          <li>
            <Link
              to="/store-expenses"
              className={`nav-link ${isActive('/store-expenses') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏪</span>
              Store Expenses
            </Link>
          </li>
          <li>
            <Link
              to="/reports"
              className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              Reports
            </Link>
          </li>
          <li>
            <Link
              to="/sales-report"
              className={`nav-link ${isActive('/sales-report') ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              Sales Reports
            </Link>
          </li>
          <li>
            <Link
              to="/configuration"
              className={`nav-link ${isActive('/configuration') ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              Konfigurasi
            </Link>
          </li>
        </ul>
      </nav>
  );
};
