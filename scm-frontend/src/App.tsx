import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Partners from './pages/admin/Partners';
import Products from './pages/admin/Products';
import Quotes from './pages/admin/Quotes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes with Nested Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="partners" element={<Partners />} />
          <Route path="products" element={<Products />} />
          <Route path="quotes" element={<Quotes />} />

          {/* Placeholders */}
          <Route path="sales" element={<div style={{ padding: '2rem' }}>매출 통계 (준비중)</div>} />
          <Route path="notices" element={<div style={{ padding: '2rem' }}>공지사항 (준비중)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
