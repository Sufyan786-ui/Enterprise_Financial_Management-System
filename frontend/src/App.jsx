import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '2rem', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/employees" element={<EmployeeManagement />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
