/**
 * QuizCard.js
 * Post-problem quiz component for contests
 * Displays a knowledge check after successful submission
 * Can receive either quizId (for fetching from backend) or problemTitle (for local quizzes)
 */

import React, { useState, useEffect } from 'react';
import { getQuiz } from '../services/quizService';

const QuizCard = ({ quizId, problemTitle, onClose, onDismiss, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(!!quizId);
  const [error, setError] = useState(null);

  // Sample quiz questions for backward compatibility (when using problemTitle)
  const sampleQuizzes = {
    'Two Sum': {
      question: 'What data structure is most efficient for the Two Sum problem?',
      options: [
        'Array (O(n²) time)',
        'Hash Map (O(n) time)',
        'Binary Search Tree (O(n log n) time)',
        'Linked List (O(n²) time)'
      ],
      correct: 1,
      explanation: 'A hash map allows us to check if the complement exists in O(1) time, making the total time complexity O(n).'
    },
    'Fibonacci Number': {
      question: 'What is the time complexity of the iterative Fibonacci solution?',
      options: [
        'O(2^n) - Exponential',
        'O(n log n) - Linearithmic',
        'O(n) - Linear',
        'O(log n) - Logarithmic'
      ],
      correct: 2,
      explanation: 'The iterative approach loops n times, making it O(n) time complexity with O(1) space complexity.'
    },
    'Reverse String': {
      question: 'What approach is most efficient for reversing a string in-place?',
      options: [
        'Create a new reversed string (O(n) space)',
        'Use two pointers swapping from ends (O(1) space)',
        'Use recursion (O(n) space for call stack)',
        'Use built-in reverse function (O(n) space)'
      ],
      correct: 1,
      explanation: 'The two-pointer approach modifies the array in-place with constant space complexity, which is optimal.'
    }
  };

  // Fetch quiz from backend if quizId provided
  useEffect(() => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    const loadQuiz = async () => {
      try {
        setError(null);
        const data = await getQuiz(quizId);
        
        // Convert backend quiz format to display format if needed
        if (data && data.questions && data.questions.length > 0) {
          const firstQuestion = data.questions[0];
          setQuizData({
            question: firstQuestion.question,
            options: firstQuestion.options?.options || [],
            correct: firstQuestion.correct_option || 0,
            explanation: `The correct answer is: ${firstQuestion.options?.options?.[firstQuestion.correct_option || 0] || 'see above'}`
          });
        } else {
          setQuizData(data);
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  // Get quiz data from either backend fetch or sample quizzes
  const quiz = quizData || (problemTitle ? sampleQuizzes[problemTitle] : null);
  
  if (!quiz) {
    if (loading) {
      return (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-700">Loading quiz...</span>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      );
    }
    return null; // No quiz available
  }

  const handleSubmit = () => {
    setShowResult(true);
  };

  const isCorrect = selectedAnswer === quiz.correct;
  const dismissHandler = onDismiss || onClose;

  return (
    <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💡</span>
          <h4 className="text-lg font-bold text-blue-900">Quick Knowledge Check</h4>
        </div>
        <button
          onClick={dismissHandler}
          className="text-blue-500 hover:text-blue-700 text-2xl font-bold leading-none hover:bg-blue-100 rounded-full p-2 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-blue-900">
          <p className="font-bold text-base mb-4 pb-3 border-b border-blue-200">{quiz.question}</p>
          <div className="space-y-3">
            {quiz.options.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all transform ${
                  selectedAnswer === idx
                    ? 'bg-blue-300 border-2 border-blue-500 scale-102'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } ${
                  showResult && idx === quiz.correct
                    ? 'bg-green-200 border-2 border-green-500'
                    : showResult && selectedAnswer === idx && !isCorrect
                    ? 'bg-red-200 border-2 border-red-500'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="quiz"
                  value={idx}
                  checked={selectedAnswer === idx}
                  onChange={() => !showResult && setSelectedAnswer(idx)}
                  disabled={showResult}
                  className="mr-3 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium">{option}</span>
                {showResult && idx === quiz.correct && (
                  <span className="ml-auto text-lg">✓</span>
                )}
                {showResult && selectedAnswer === idx && !isCorrect && (
                  <span className="ml-auto text-lg">✗</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all transform hover:scale-105"
          >
            Check Answer
          </button>
        ) : (
          <>
            <div
              className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                isCorrect
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : 'bg-red-100 border-red-400 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{isCorrect ? '🎉' : '📚'}</span>
                <strong>{isCorrect ? 'Perfect!' : 'Not quite...'}</strong>
              </div>
              <p className="text-xs leading-relaxed">{quiz.explanation}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedAnswer(null);
                  setShowResult(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  if (onComplete) onComplete({ correct: isCorrect });
                  dismissHandler();
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
