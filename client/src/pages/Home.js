import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedSheets } from '../services/sheetsService';

const Home = ({ user }) => {
  const [featuredSheets, setFeaturedSheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);

  useEffect(() => {
    const loadFeaturedSheets = async () => {
      setSheetsLoading(true);
      try {
        const sheets = await getFeaturedSheets();
        setFeaturedSheets(sheets.slice(0, 3));
      } catch (err) {
        console.error('Failed to load featured sheets:', err);
      } finally {
        setSheetsLoading(false);
      }
    };

    loadFeaturedSheets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute -bottom-8 right-4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Master Coding Skills with <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">CodiGloo</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 font-light">
            A cool place to code. Practice real-world problems, ace your interviews, and join thousands of successful developers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 sm:mt-10">
            <Link
              to="/practice"
              className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              Start Coding Now →
            </Link>
            {!user && (
              <Link
                to="/register"
                className="bg-white text-blue-600 hover:bg-blue-50 border-2 border-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                Create Free Account
              </Link>
            )}
          </div>
          <p className="text-blue-100 mt-8 text-sm sm:text-base">✓ 1000+ problems  ✓ Instant feedback  ✓ Track your progress</p>
        </div>
      </section>

      {/* Featured Sheets Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12 sm:mb-16 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">📚 Curated Learning Paths</h2>
              <p className="text-gray-600 text-base sm:text-lg">Structured problem sets to master key concepts</p>
            </div>
            <Link
              to="/practice/sheets"
              className="text-blue-600 hover:text-blue-700 font-bold text-base sm:text-lg flex items-center gap-2 transition-colors hover:gap-3"
            >
              View All →
            </Link>
          </div>
        </div>
        {sheetsLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading learning paths...</p>
          </div>
        ) : featuredSheets.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSheets.map((sheet, idx) => (
              <Link
                key={sheet.id}
                to={`/practice/sheets/${sheet.id}`}
                className="card-premium animate-fade-scale animate-shine group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {sheet.title}
                    </h3>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                      sheet.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' :
                      sheet.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sheet.difficulty_level?.toUpperCase() || 'MIXED'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{sheet.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-4">
                    <div className="flex gap-4">
                      <span className="font-semibold text-gray-900">📚 {sheet.total_problems}</span>
                      {sheet.estimated_hours && <span className="font-semibold text-gray-900">⏱️ {sheet.estimated_hours}h</span>}
                    </div>
                    <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 sm:py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose CodiGloo?</h2>
            <p className="text-lg sm:text-xl text-gray-600">Everything you need to become a better developer</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: '💻', title: 'Interactive Coding', desc: 'Write, compile, and test code instantly with real-time feedback' },
              { icon: '🎯', title: 'Smart Challenges', desc: 'Practice problems curated from top companies and interviews' },
              { icon: '📊', title: 'Track Progress', desc: 'Monitor your improvement with detailed analytics and statistics' },
              { icon: '🏆', title: 'Leaderboards', desc: 'Compete with other developers and see how you rank' },
              { icon: '🎓', title: 'Learning Paths', desc: 'Follow structured roadmaps to master specific skills' },
              { icon: '⚡', title: 'Instant Feedback', desc: 'Get immediate code reviews and performance metrics' }
            ].map((feature, idx) => (
              <div key={idx} className="group border-2 border-gray-100 p-6 sm:p-8 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base sm:text-md">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">Ready to Level Up?</h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of 10,000+ developers solving problems and preparing for their dream jobs.
          </p>
          <Link
            to={user ? "/practice" : "/register"}
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 px-8 sm:px-10 py-4 rounded-lg font-bold text-base sm:text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            {user ? "Start Practicing Now" : "Sign Up Free"}
          </Link>
          <p className="text-blue-100 mt-6 text-sm sm:text-base">No credit card required • Free forever plan available</p>
        </div>
      </section>
    </div>
  );
};

export default Home;