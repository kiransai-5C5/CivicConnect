import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Landing from './pages/Landing/Landing';
import Signup from './pages/Signup/Signup';
import OtpVerification from './pages/OtpVerification/OtpVerification';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPasswordVerify from './pages/ResetPasswordVerify/ResetPasswordVerify';
import ResetPassword from './pages/ResetPassword/ResetPassword';

import Dashboard from './pages/Dashboard/Dashboard';
import Petitions from './pages/Petitions/Petitions';
import Polls from './pages/Polls/Polls';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { isAuthenticated } from './utils/auth';
import './App.css';

// Petition Pages
// import PetitionList from './pages/Petitions/PetitionList';
// import PetitionCreate from './pages/Petitions/PetitionCreate';
// import PetitionDetails from './pages/Petitions/PetitionDetails';

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Landing />}
        />
        <Route
          path="/signup"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Signup />}
        />
        <Route
          path="/verify-otp"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <OtpVerification />}
        />
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password-verify"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <ResetPasswordVerify />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated() ? <Navigate to="/dashboard" /> : <ResetPassword />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/petitions"
          element={
            <ProtectedRoute>
              <Petitions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polls"
          element={
            <ProtectedRoute>
              <Polls />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes */}
        <Route
          path="/officials"
          element={
            <ProtectedRoute>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Officials Page - Coming Soon</h2>
                <p>This page is under development</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

 
        {/* Redirect any unknown route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
