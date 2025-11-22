import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Practice from './pages/Practice';
import ProblemDetail from './pages/ProblemDetail';
import Compiler from './pages/Compiler';
import Quiz from './pages/Quiz';
import QuizDetail from './pages/QuizDetail';
import ContestsList from './pages/ContestsList';
import ContestAttempt from './pages/ContestAttempt';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Context
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar user={userData} />
        <main className="flex-grow pb-24">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home user={userData} />} />
              {/**
               * Redirect logic adjusted:
               * We only redirect away from auth pages when the user has fully synced data AND is verified.
               * This prevents a cached Firebase user (unverified or failed sync) from blocking navigation
               * to /login or /register.
               */}
              <Route
                path="/login"
                element={
                  userData && (userData.email_verified === 1 || userData.email_verified === true)
                    ? <Navigate to="/" />
                    : <Login />
                }
              />
              <Route
                path="/register"
                element={
                  userData && (userData.email_verified === 1 || userData.email_verified === true)
                    ? <Navigate to="/" />
                    : <Register />
                }
              />
              <Route
                path="/forgot-password"
                element={
                  userData && (userData.email_verified === 1 || userData.email_verified === true)
                    ? <Navigate to="/" />
                    : <ForgotPassword />
                }
              />
              <Route path="/practice" element={<Practice user={userData} />} />
              <Route path="/practice/:id" element={<ProblemDetail user={userData} />} />
              <Route path="/compiler" element={<Compiler user={userData} />} />
              <Route path="/quizzes" element={<Quiz user={userData} />} />
              <Route path="/quizzes/:id" element={<QuizDetail user={userData} />} />
              <Route path="/contests" element={
                <ProtectedRoute user={userData}>
                  <ContestsList user={userData} />
                </ProtectedRoute>
              } />
              <Route path="/contests/:id" element={<ContestAttempt user={userData} />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute user={userData}>
                  <Dashboard user={userData} />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin/*" element={
                <AdminRoute user={userData}>
                  <AdminPanel user={userData} />
                </AdminRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;