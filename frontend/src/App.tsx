import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { MarketDataMgmt } from './pages/MarketDataMgmt';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/market-data" element={<MarketDataMgmt />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
