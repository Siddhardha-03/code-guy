import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Practice from './pages/Practice';
import ProblemDetail from './pages/ProblemDetail';
import Sheets from './pages/Sheets';
import SheetDetail from './pages/SheetDetail';
import Compiler from './pages/Compiler';
import Quiz from './pages/Quiz';
import QuizDetail from './pages/QuizDetail';
import ContestsList from './pages/ContestsList';
import ContestAttempt from './pages/ContestAttempt';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';

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
  const topAdRef = useRef(null);

  // Initialize top AdSense slot after mount (requires adsbygoogle script in index.html)
  useEffect(() => {
    try {
      if (window.adsbygoogle && topAdRef.current) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.warn('AdSense top slot load skipped:', err);
    }
  }, []);

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

        {/* Google AdSense: top-of-page responsive banner below nav */}
        <div className="px-4 pt-2 pb-4">
          {/* AdSense slot: top banner below nav, borderless container */}
          <div className="bg-transparent p-2">
            {/* Replace data-ad-client and data-ad-slot with your AdSense IDs */}
            <ins
              ref={topAdRef}
              className="adsbygoogle block w-full"
              style={{ display: 'block', minHeight: '90px' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXX"
              data-ad-slot="0987654321"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          </div>
        </div>

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
              <Route path="/practice/sheets" element={<Sheets user={userData} />} />
              <Route path="/practice/sheets/:sheetId" element={<SheetDetail user={userData} />} />
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
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              
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