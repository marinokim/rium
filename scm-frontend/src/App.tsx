import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Placeholders for future routes */}
        <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />
        <Route path="/admin" element={<div>Admin (Coming Soon)</div>} />
      </Routes>
    </Router>
  );
}

export default App;
