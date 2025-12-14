import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { MarketDataMgmt } from './pages/MarketDataMgmt';
import { MarketDataBrowser } from './pages/MarketDataBrowser';
import { ConfigManagement } from './pages/ConfigManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/config" element={<ConfigManagement />} />
          <Route path="/market-data" element={<MarketDataMgmt />} />
          <Route path="/market-data/browse" element={<MarketDataBrowser />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
