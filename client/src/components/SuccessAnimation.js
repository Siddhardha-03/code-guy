import React, { useEffect, useState } from 'react';

const SuccessAnimation = ({ show, onComplete }) => {
  const [particlesCount] = useState(50);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: particlesCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.2,
        duration: 2 + Math.random() * 1
      }));
      setParticles(newParticles);

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, particlesCount, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      {/* Main success circle */}
      <div className="relative w-32 h-32 mb-20">
        {/* Ripple effect */}
        <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute inset-2 border-4 border-green-300 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>

        {/* Checkmark circle */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl flex items-center justify-center animate-scale-in">
          <svg className="w-16 h-16 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 blur-xl animate-pulse" style={{ animationDuration: '1s' }}></div>
      </div>

      {/* Success text with animation */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20 text-center">
        <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 animate-fade-in-down">
          Accepted! 🎉
        </h2>
        <p className="text-lg text-green-500 dark:text-green-300 mt-2 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
          All test cases passed
        </p>
      </div>

      {/* Confetti particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-green-400 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: '40%',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            opacity: 0.8
          }}
        ></div>
      ))}

      {/* Style for animations */}
      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0) rotateZ(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotateZ(10deg);
          }
          100% {
            transform: scale(1) rotateZ(0deg);
            opacity: 1;
          }
        }

        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(300px) rotateZ(720deg);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SuccessAnimation;
