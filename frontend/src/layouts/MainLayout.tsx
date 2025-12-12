import { Outlet, Link, useLocation } from 'react-router-dom';

export function MainLayout() {
  const location = useLocation();

  const linkStyle = (path: string) => ({
    color: location.pathname === path ? '#2962ff' : '#d1d4dc',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: location.pathname === path ? 600 : 400,
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'all 0.2s',
    backgroundColor: location.pathname === path ? 'rgba(41, 98, 255, 0.1)' : 'transparent',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        background: '#131722',
      }}
    >
      {/* Header/Navigation */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          background: '#1e222d',
          borderBottom: '1px solid #2b2b43',
          gap: '24px',
        }}
      >
        <h1 style={{ margin: 0, color: '#fff', fontSize: '20px', marginRight: '16px' }}>
          PyTrader
        </h1>
        <Link to="/" style={linkStyle('/')}>
          Dashboard
        </Link>
        <Link to="/market-data" style={linkStyle('/market-data')}>
          Market Data
        </Link>
      </nav>

      {/* Page content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
