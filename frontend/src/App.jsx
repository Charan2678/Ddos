import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import MLTraining from './pages/MLTraining';
import Prediction from './pages/Prediction';
import Reports from './pages/Reports';
import ModelComparison from './pages/ModelComparison';
import History from './pages/History';
import AdminPanel from './pages/AdminPanel';

// Shared Layout for authenticated dashboard pages
const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - fixed width 64 */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        <main className="p-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="live-monitoring" element={<LiveMonitoring />} />
            <Route path="ml-training" element={<MLTraining />} />
            <Route path="predict" element={<Prediction />} />
            <Route path="reports" element={<Reports />} />
            <Route path="model-comparison" element={<ModelComparison />} />
            <Route path="history" element={<History />} />
            <Route path="admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all route -> Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      
      {/* Global alert toast notifier */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;
