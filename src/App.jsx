console.log("APP RUNNING");
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Intro from './pages/Intro';
import Login from './pages/Login';
import Roles from './pages/Roles';
import WorkerDashboard from './pages/WorkerDashboard';
import HirerDashboard from './pages/HirerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/roles" element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          } />
          <Route path="/worker" element={
            <ProtectedRoute>
              <WorkerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hirer" element={
            <ProtectedRoute>
              <HirerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
