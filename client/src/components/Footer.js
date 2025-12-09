import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white relative">
      {/* Main Footer Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-bold flex items-center gap-3 mb-4 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">🧑‍💻</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">CodeGuy</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Master coding skills with thousands of problems, real-world challenges, and instant feedback from industry experts.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors" title="GitHub">
                <span>🐙</span>
              </a>
              <a href="#" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors" title="Twitter">
                <span>𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors" title="LinkedIn">
                <span>💼</span>
              </a>
            </div>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded"></span>
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/practice" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Practice Problems
                </Link>
              </li>
              <li>
                <Link to="/practice/sheets" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link to="/quizzes" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Coding Quizzes
                </Link>
              </li>
              <li>
                <Link to="/compiler" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Online Compiler
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded"></span>
              Account
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded"></span>
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-blue-300 transition-colors flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800"></div>

        {/* Bottom Footer */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            <p>&copy; {currentYear} <span className="font-bold text-white">CodeGuy</span>. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>
    </footer>
  );
};

export default Footer;