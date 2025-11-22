import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/firebaseAuthService';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const { setUserData } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUserData(null);
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="flex justify-between items-center">
          {/* Logo and site name - Left */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <span className="mr-2">🧑‍💻</span>
            <span>CodeGuy</span>
          </Link>

          {/* Desktop Navigation - Right */}
          <div className="hidden md:flex items-center gap-6">
            {/* Navigation links */}
            <div className="flex items-center gap-6">
              <Link to="/practice" className="nav-link">
                Practice
              </Link>
              <Link to="/compiler" className="nav-link">
                Compiler
              </Link>
              <Link to="/quizzes" className="nav-link">
                Quizzes
              </Link>
              {user && (
                <>
                  <Link to="/contests" className="nav-link">
                    Contests
                  </Link>
                  <Link to="/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                </>
              )}
              {user && user.role === 'admin' && (
                <Link to="/admin" className="nav-link">
                  Admin
                </Link>
              )}
            </div>

            {/* Theme toggle and auth buttons */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Profile Avatar */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm flex items-center gap-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn btn-ghost btn-sm flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-3 pt-4">
              <Link
                to="/practice"
                className="nav-link px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                Practice
              </Link>
              <Link
                to="/compiler"
                className="nav-link px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                Compiler
              </Link>
              <Link
                to="/quizzes"
                className="nav-link px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                Quizzes
              </Link>
              {user && (
                <>
                  <Link
                    to="/contests"
                    className="nav-link px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMobileMenu}
                  >
                    Contests
                  </Link>
                  <Link
                    to="/dashboard"
                    className="nav-link px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              {user && user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="nav-link px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={closeMobileMenu}
                >
                  Admin
                </Link>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10,17 15,12 10,7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 py-2 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700"
                      onClick={closeMobileMenu}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;