import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContest, getContestItems, finalizeContest, registerForContest, submitContestCode } from '../services/contestService';
import { getQuestion } from '../services/questionService';
import { getQuiz, submitQuiz as submitQuizService } from '../services/quizService';
import {
  runCode as runSubmissionCode,
  submitCode as submitSolution,
  getCodeDraft,
  saveCodeDraft
} from '../services/submissionService';
import CodeEditor from '../components/CodeEditor';
import Toast from '../components/Toast';
// Note: QuizCard component retained in repo for legacy/fallback, but
// inline contest quiz flow (existing in-page quiz UI) will be used.
import { generateCodeTemplate } from '../utils/codeScaffold';

const formatTime = (seconds) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${ss < 10 ? '0' : ''}${ss}`;
};

const ContestAttempt = ({ user }) => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contestNotStarted, setContestNotStarted] = useState(false);
  const [showRawRunResponse, setShowRawRunResponse] = useState(false);
  const [contestEnded, setContestEnded] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [participantStatus, setParticipantStatus] = useState(null);
  
  // UI state
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Coding state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [resultStatus, setResultStatus] = useState(null);
  const [linkedQuizId, setLinkedQuizId] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef('');

  // problem detail for coding items
  const [problem, setProblem] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [testCaseIndex, setTestCaseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [quizProgress, setQuizProgress] = useState(0);

  const loadContest = useCallback(async () => {
    try {
      setError(null);
      const c = await getContest(contestId);
      setContest(c);
      
      // Check if user is registered by examining participant_status from response
      console.log(`[Contest Load] participant_status: ${c.participant_status}`);
      const registered = c.participant_status !== null && c.participant_status !== undefined;
      setIsRegistered(registered);
      setParticipantStatus(c.participant_status);
      
      if (!registered) {
        setError('You are not registered for this contest. Please register first.');
        setLoading(false);
        return;
      }
      
      // Check if contest is already finalized/completed
      if (c.participant_status === 'completed') {
        setContestEnded(true);
      }

      // Debug: Log the raw contest times from server
      console.log('[Contest Debug] Raw contest data:', {
        title: c.title,
        start_time: c.start_time,
        end_time: c.end_time,
        status: c.status
      });

      // compute remaining time if end_time exists
      if (c && c.end_time) {
        const now = Date.now();
        // Ensure proper date parsing for MySQL datetime format
        const end = new Date(c.end_time.replace(' ', 'T')).getTime();
        const timeLeftSeconds = Math.max(Math.floor((end - now) / 1000), 0);
        
        console.log('[Contest Debug] End time calculation:', {
          end_time_raw: c.end_time,
          end_time_parsed: new Date(c.end_time).toISOString(),
          current_time: new Date(now).toISOString(),
          time_left_seconds: timeLeftSeconds,
          contest_ended: end <= now
        });
        
        setTimeLeft(timeLeftSeconds);
        setContestEnded(end <= now);
      }
      
      if (c && c.start_time) {
        const now = Date.now();
        // Ensure proper date parsing for MySQL datetime format
        const start = new Date(c.start_time.replace(' ', 'T')).getTime();
        const notStarted = start > now;
        
        console.log('[Contest Debug] Start time calculation:', {
          start_time_raw: c.start_time,
          start_time_parsed: new Date(c.start_time).toISOString(),
          current_time: new Date(now).toISOString(),
          time_diff_minutes: Math.floor((start - now) / (1000 * 60)),
          not_started: notStarted
        });
        
        setContestNotStarted(notStarted);
      }

      const it = await getContestItems(contestId);
      setItems(it || []);
    } catch (err) {
      console.error('Failed to load contest:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load contest';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    loadContest();
  }, [loadContest]);

  const handleRegisterNow = async () => {
    try {
      console.log(`[Register] Registering for contest ${contestId}`);
      await registerForContest(contestId);
      showToast('Successfully registered! Loading contest...', 'success');
      // Reload contest after registration
      await loadContest();
    } catch (err) {
      console.error('Registration failed:', err);
      const serverMsg = err.serverMessage || err.data?.message || err.data?.error;
      const msg = serverMsg || err.message || 'Failed to register for contest';
      // If already registered, load contest instead of blocking
      if (err.status === 400 && /already registered/i.test(msg)) {
        showToast('You are already registered. Loading contest...', 'info');
        await loadContest();
        return;
      }
      showToast(msg, 'error');
    }
  };

  const handleExitSession = () => {
    // Navigate away; timer continues on server-side (no backend action required)
    navigate('/contests');
  };

  const handleFinalSubmit = async () => {
    if (!contest) {
      showToast('Contest data not loaded yet.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to finalize your contest? This will prevent further submissions.')) return;
    try {
      console.log(`[Final Submit] Finalizing contest ${contestId} for user`);
      await finalizeContest(contestId);
      showToast('Contest finalized successfully! Your session is now complete.', 'success');
      setContestEnded(true);
      setParticipantStatus('completed');
      // Redirect to contests page after a short delay
      setTimeout(() => navigate('/contests'), 2000);
    } catch (err) {
      console.error('Finalize failed:', err);
      const msg = err.message || 'Failed to finalize contest';
      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    if (!contest) return;
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, contest]);

  // Keep displayItems identical to items for a simple, linear contest navigation.
  // Quizzes should be added as their own contest items (no virtual/injected items).
  const displayItems = items;

  // Load selected item details
  useEffect(() => {
    const item = displayItems[selectedIndex];
    if (!item) return;

    // Store linked quiz ID if present (for display after submission)
    setLinkedQuizId(item.linked_quiz_id || null);
    setQuizCompleted(false); // Reset quiz completion state

    if (item.item_type === 'coding') {
      (async () => {
        try {
          const data = await getQuestion(item.item_id);
          // `getQuestion` returns { question, testCases }
          setProblem(data.question || null);
          setTestCases(data.testCases || []);
          
          // Try to load existing draft first
          try {
            const draft = await getCodeDraft(item.item_id, language);
            if (draft && typeof draft.code === 'string' && draft.code.length > 0) {
              setCode(draft.code);
              lastSavedRef.current = draft.code;
              return;
            }
          } catch (draftError) {
            console.error('Draft load failed, generating template:', draftError);
          }
          
          // Generate template using improved scaffolding
          const template = generateCodeTemplate(
            data.question,
            language,
            data.testCases || []
          );
          setCode(template);
          lastSavedRef.current = template;
        } catch (err) {
          console.error('Failed to load coding item:', err);
          setCode('// Error loading problem. Please try again.');
        }
      })();
    } else if (item.item_type === 'quiz') {
      (async () => {
        try {
          const q = await getQuiz(item.item_id);
          setQuiz(q);
          setAnswers({});
          // set quiz timer if duration present
          const duration = q?.duration || contest?.duration || 0;
          setQuizTimeLeft(duration * 60);
        } catch (err) {
          console.error('Failed to load quiz item:', err);
        }
      })();
    }
  }, [items, selectedIndex, language, contest]);

  useEffect(() => {
    let t;
    if (quiz && quizTimeLeft > 0) {
      t = setTimeout(() => setQuizTimeLeft(quizTimeLeft - 1), 1000);
    } else if (quiz && quizTimeLeft === 0 && quiz) {
      // auto-submit quiz when its timer hits zero
      (async () => {
        try {
          const currentItem = displayItems[selectedIndex];
          let contestItemIdToSend = null;
          if (currentItem?.id && !isNaN(currentItem.id)) {
            contestItemIdToSend = parseInt(currentItem.id);
          }

          // Determine quiz id robustly (support wrapper returned by getQuiz)
          const quizIdToSend = Number(quiz?.id) || Number(quiz?.quiz?.id) || Number(currentItem?.item_id);
          if (!quizIdToSend || Number.isNaN(quizIdToSend)) {
            throw new Error('Invalid quiz id for auto-submission');
          }

          console.log('Auto-submitting quiz:', { quizId: quizIdToSend, contestId, contestItemIdToSend });

          await submitQuizService(quizIdToSend, {
            answers,
            contestId: parseInt(contestId),
            contestItemId: contestItemIdToSend
          });
          
          setQuizCompleted(true);
          showToast('Quiz auto-submitted (time expired)', 'info');
          
          if (selectedIndex < displayItems.length - 1) {
            setSelectedIndex(selectedIndex + 1);
          }
        } catch (e) {
          console.error('Auto-submit error:', e);
        }
      })();
    }
    return () => clearTimeout(t);
  }, [quiz, quizTimeLeft]);

  const handleCodeChange = (val) => setCode(val);

  const handleRunCode = async () => {
  const item = displayItems[selectedIndex];
    if (!item || item.item_type !== 'coding') return;
    
    const currentTestCase = testCases[testCaseIndex];
    if (!currentTestCase) {
      setOutput('No test case selected');
      return;
    }

    setExecuting(true);
    setError(null);
    setOutput('');
    setTestResults([]);
    setResultStatus(null);

    try {
      const res = await runSubmissionCode({ 
        code, 
        language, 
        questionId: item.item_id,
        testCaseId: currentTestCase.id,
        input: currentTestCase.input
      });

      console.log('Run result:', res);

      if (!res) {
        setOutput('No response from server');
        setResultStatus('error');
        return;
      }

      // Build output display similar to ProblemDetail
      let outputText = '';
      const stdout = (res.stdout || res.actualOutput || '').toString().trim();
      const stderr = (res.stderr || res.error || res.compileOutput || '').toString().trim();

      // Normalize 'null'/'undefined' strings
      const actualOutput = stdout === 'null' || stdout === 'undefined' ? '' : stdout;
      const errorOutput = stderr === 'null' || stderr === 'undefined' ? '' : stderr;

      if (actualOutput) {
        outputText += `Output:\n${actualOutput}`;
      }

      if (errorOutput) {
        if (outputText) outputText += '\n\n';
        outputText += `Error:\n${errorOutput}`;
      }

      if (!outputText) {
        outputText = res.compileOutput || res.message || 'No output';
      }

      setOutput(outputText);

      // Set result status and format test result
      const passed = res.passed && !errorOutput;
      setResultStatus(passed ? 'success' : errorOutput ? 'error' : 'failed');
      setTestResults([{
        testCaseId: currentTestCase.id,
        testNum: testCaseIndex + 1,
        input: currentTestCase.input,
        expectedOutput: currentTestCase.expected_output,
        actualOutput,
        passed,
        error: errorOutput,
        hidden: currentTestCase.hidden
      }]);

    } catch (err) {
      console.error('Run error:', err);
      setOutput(`Run failed: ${err.message || err}`);
      setResultStatus('error');
    } finally {
      setExecuting(false);
    }
  };

  // Auto-save drafts (debounced)
  useEffect(() => {
  const item = displayItems[selectedIndex];
  if (!item || item.item_type !== 'coding') return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (code === lastSavedRef.current) {
          setSaving(false);
          return;
        }
        await saveCodeDraft(item.item_id, { language, code });
        lastSavedRef.current = code;
        setSaving(false);
        showToast('Code auto-saved', 'info');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [code, language, items, selectedIndex]);

  const handleSubmitCode = async () => {
    if (confirmSubmit) {
      setConfirmSubmit(false);
      const item = displayItems[selectedIndex];
      if (!item || item.item_type !== 'coding') return;
      
      setSubmitting(true);
      try {
        // Use new contest code submission endpoint with scoring
        const res = await submitContestCode(
          parseInt(contestId),
          item.id,
          code,
          language
        );
        
        // Show detailed results
        const passedMsg = `✓ ${res.passedCount}/${res.totalTests} test cases passed`;
        const scoreMsg = `Score: ${res.score} points`;
        setOutput(`${passedMsg}\n${scoreMsg}\n\nTest Results:\n${res.results.map((r, i) => 
          `Test ${i + 1}: ${r.passed ? '✓ PASS' : '✗ FAIL'}${r.hidden ? ' (hidden)' : ''}`
        ).join('\n')}`);
        
        setResultStatus(res.passed ? 'success' : 'partial');
        setTestResults(res.results || []);
        
        showToast(
          res.passed 
            ? `Perfect! All tests passed. Score: ${res.score}` 
            : `${res.passedCount}/${res.totalTests} tests passed. Score: ${res.score}`,
          res.passed ? 'success' : 'warning'
        );
        
        // Save final version
        await saveCodeDraft(item.item_id, { language, code });
      } catch (err) {
        const errorMsg = err.message || 'Submission failed';
        setOutput(`Submission failed: ${errorMsg}`);
        setResultStatus('error');
        showToast('Failed to submit solution', 'error');
      } finally {
        setSubmitting(false);
      }
    } else {
      setConfirmSubmit(true);
      setTimeout(() => setConfirmSubmit(false), 3000);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: optionIndex };
      if (quiz?.questions) {
        const progress = Math.round((Object.keys(newAnswers).length / quiz.questions.length) * 100);
        setQuizProgress(progress);
      }
      return newAnswers;
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setSubmitting(true);
    try {
      const currentItem = displayItems[selectedIndex];
      let contestItemIdToSend = null;
      
      // Only send contestItemId if it's a real numeric ID from the contest_items table
      if (currentItem?.id && !isNaN(currentItem.id)) {
        contestItemIdToSend = parseInt(currentItem.id);
      }

      // Ensure we send a numeric quiz id. If `quiz.id` is missing use the contest item.item_id
  const quizIdToSend = Number(quiz?.id) || Number(quiz?.quiz?.id) || Number(currentItem?.item_id);
      if (!quizIdToSend || Number.isNaN(quizIdToSend)) {
        throw new Error('Invalid quiz id for submission');
      }

      console.log('Submitting quiz:', {
        quizId: quizIdToSend,
        contestId,
        contestItemIdToSend,
        answersCount: Object.keys(answers).length,
        totalQuestions: quiz.questions?.length
      });

      const result = await submitQuizService(quizIdToSend, {
        answers,
        contestId: parseInt(contestId),
        contestItemId: contestItemIdToSend
      });
      
      console.log('Quiz submission result:', result);

      const scorePercentage = result.score || result.correctAnswers || 0;
      showToast(`Quiz submitted! Score: ${scorePercentage}/${result.totalQuestions}`, 'success');
      
      // Mark quiz as completed
      setQuizCompleted(true);
      
      // Move to next display item if available
      if (selectedIndex < displayItems.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } catch (err) {
      console.error('Failed to submit quiz - full error:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to submit quiz';
      console.error('Error message:', errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // When a linked quiz is available after passing a problem, open it
  // using the existing contest quiz UI. Prefer an existing contest item
  // (if the quiz was also added as a contest item). Otherwise insert
  // a temporary quiz item right after the current item and select it.
  const handleOpenLinkedQuiz = async () => {
    if (!linkedQuizId) return;

    // try to find an existing quiz item in the contest items
    const existingIndex = displayItems.findIndex(it => it.item_type === 'quiz' && String(it.item_id) === String(linkedQuizId));
    if (existingIndex !== -1) {
      setSelectedIndex(existingIndex);
      return;
    }

    // Insert a temporary quiz item after the current item and select it
    const tempId = `temp-quiz-${linkedQuizId}-${Date.now()}`;
    const tempItem = {
      id: tempId,
      item_type: 'quiz',
      item_id: linkedQuizId,
      quiz_title: 'Loading quiz...'
    };

    setItems(prev => {
      const arr = [...prev];
      // find original item index in prev corresponding to current display selection
      const currentDisplay = displayItems[selectedIndex];
      const origIndex = arr.findIndex(x => x.id === currentDisplay.id || x.id === currentDisplay.parent_item_id);
      const insertAt = origIndex === -1 ? (selectedIndex + 1) : (origIndex + 1);
      arr.splice(insertAt, 0, tempItem);
      return arr;
    });

    // select the display position immediately after current
    setSelectedIndex(selectedIndex + 1);
  };

  if (loading) {
    return <div className="p-6">Loading contest…</div>;
  }

  if (!contest) {
    return <div className="p-6">Contest not found.</div>;
  }

  // Show completion message if participant has finalized
  if (participantStatus === 'completed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mb-4">
            <svg className="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Contest Completed</h2>
          <p className="text-gray-600 mb-2">{contest.title}</p>
          <p className="text-gray-600 mb-6">You have successfully submitted and finalized your contest. No further submissions are allowed.</p>
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Your Score</div>
              <div className="text-2xl font-bold text-blue-600">{contest.current_score || 0} points</div>
            </div>
            <button
              onClick={() => navigate('/contests')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Back to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show registration prompt if not registered
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Registered</h2>
          <p className="text-gray-600 mb-4">{contest.title}</p>
          <p className="text-gray-600 mb-6">You need to register for this contest before you can participate.</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/contests')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
            >
              Back to Contests
            </button>
            <button
              onClick={handleRegisterNow}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selected = displayItems[selectedIndex];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{contest.title}</h2>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleExitSession}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded border hover:bg-gray-200 text-sm"
              >
                Exit Session
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={contestNotStarted || contestEnded}
                className={`px-3 py-1 rounded text-sm font-semibold ${contestNotStarted || contestEnded ? 'bg-gray-300 text-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
              >
                Final Submit Contest
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Time Remaining</div>
            <div className={`text-2xl font-mono font-bold ${timeLeft <= 300 && timeLeft > 0 ? 'text-red-600' : timeLeft === 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {contestNotStarted && (
          <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-200 text-yellow-800 text-sm">
            ⏱️ This contest has not started yet. You will be able to access problems when the contest begins.
          </div>
        )}
        {contestEnded && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 text-red-800 text-sm">
            ✓ This contest has ended. Submissions are disabled.
          </div>
        )}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 text-red-800 text-sm">
            ✗ {error}
          </div>
        )}
      </div>

      {/* Problems List (Horizontal Scroll) */}
      {!loading && items.length > 0 && (
        <div className="border-b bg-gray-50 px-6 py-3 overflow-x-auto">
          <div className="flex gap-2">
            {displayItems.map((it, idx) => {
              const hasUnsavedChanges = it.item_type === 'coding' && idx === selectedIndex && code !== lastSavedRef.current;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={it.id || `${it.item_type}-${it.item_id}`}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (window.confirm('You have unsaved changes. Are you sure you want to switch problems?')) {
                        setSelectedIndex(idx);
                      }
                    } else {
                      setSelectedIndex(idx);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}>
                  <span className="text-sm font-medium">
                    {idx + 1}. {it.item_type === 'coding' ? (it.question_title || `Problem ${it.item_id}`) : (it.quiz_title || `Quiz ${it.item_id}`)}
                  </span>
                  {hasUnsavedChanges && <span className="text-yellow-300 text-xs">●</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content - Split View for Coding, Full Width for Quiz */}
      <div className="flex-1 flex overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-gray-500 text-lg">
                {loading ? '⏳ Loading problems...' : 'Select a problem to begin'}
              </p>
            </div>
          </div>
        ) : selected.item_type === 'quiz' ? (
          /* FULL WIDTH QUIZ VIEW */
          <div className="flex-1 overflow-y-auto bg-white">
            {quiz && (
              <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span><strong>{Object.keys(answers).length}</strong>/{quiz.questions?.length || 0} answered</span>
                    <span>Time: {formatTime(quizTimeLeft)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${quizProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-6">
                  {(quiz.questions || []).map((q, qi) => (
                    <div key={q.id} className="border rounded p-4">
                      <div className="mb-4">
                        <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-center text-sm mr-2">{qi + 1}</span>
                        <span className="font-medium">{q.question}</span>
                      </div>
                      <div className="space-y-2 ml-10">
                        {(q.options || []).map((opt, oi) => (
                          <label
                            key={oi}
                            className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${
                              answers[q.id] === oi
                                ? 'bg-blue-50 border-blue-500'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === oi}
                              onChange={() => handleAnswerSelect(q.id, oi)}
                              className="mr-3"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button at the End */}
                <div className="mt-8 border-t pt-6">
                  <button 
                    onClick={handleSubmitQuiz} 
                    disabled={submitting || contestNotStarted || contestEnded}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
                  >
                    {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    {submitting ? 'Submitting...' : '✓ Submit Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* LEFT PANEL - Problem Description (Coding Only) */}
            <div className="w-1/2 border-r overflow-y-auto bg-white"
              style={{maxHeight: 'calc(100vh - 200px)'}}>
              {selected.item_type === 'coding' && (
                <div className="p-6">
                  {/* Title and Difficulty */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h1 className="text-3xl font-bold">{selected.question_title || problem?.title || 'Coding Problem'}</h1>
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                        {selected.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="mb-6 border-b">
                    <div className="flex gap-6">
                      <button
                        onClick={() => setActiveTab('description')}
                        className={`pb-3 font-medium transition-colors ${
                          activeTab === 'description'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Description
                      </button>
                      <button
                        onClick={() => setActiveTab('testcases')}
                        className={`pb-3 font-medium transition-colors ${
                          activeTab === 'testcases'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Test Cases ({testCases.length})
                      </button>
                    </div>
                  </div>

                  {/* Description Tab */}
                  {activeTab === 'description' && (
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: problem?.description || '' }} />
                    </div>
                  )}

                  {/* Test Cases Tab */}
                  {activeTab === 'testcases' && (
                    <div className="space-y-4">
                      {testCases.length === 0 ? (
                        <div className="text-sm text-gray-500">No test cases available.</div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Test Case:</label>
                            <select 
                              value={testCaseIndex} 
                              onChange={(e) => setTestCaseIndex(parseInt(e.target.value, 10))} 
                              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {testCases.map((tc, idx) => (
                                <option key={idx} value={idx}>
                                  Example {idx + 1}{tc.hidden ? ' (Hidden)' : ''}
                                </option>
                              ))}
                            </select>
                            <div className="ml-auto flex gap-4 text-sm">
                              <span className="text-green-600"><strong>{testCases.filter(tc => !tc.hidden).length}</strong> Visible</span>
                              <span className="text-yellow-600"><strong>{testCases.filter(tc => tc.hidden).length}</strong> Hidden</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded border border-gray-200 p-4 space-y-4">
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Input:</div>
                              <pre className="bg-white border border-gray-200 rounded p-3 text-sm font-mono text-gray-900 overflow-x-auto">
                                {testCases[testCaseIndex]?.input || '—'}
                              </pre>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Output:</div>
                              <pre className="bg-white border border-gray-200 rounded p-3 text-sm font-mono text-gray-900 overflow-x-auto">
                                {testCases[testCaseIndex]?.hidden ? '(Hidden until submission)' : (testCases[testCaseIndex]?.expected_output || '—')}
                              </pre>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Removed inline quiz rendering from left panel - now full width above */}
            </div>

            {/* RIGHT PANEL - Code Editor (Coding Only) */}
            {selected.item_type === 'coding' && (
              <div className="w-1/2 flex flex-col bg-white">
                {/* Code Editor Header */}
                <div className="border-b px-6 py-3 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)} 
                      className="px-3 py-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>

                    {/* Debug: toggle to show raw server response for Run */}
                    <label className="ml-2 flex items-center text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={showRawRunResponse} onChange={() => setShowRawRunResponse(s => !s)} className="mr-2" />
                      Raw
                    </label>

                    <div className="text-sm text-gray-600">
                      {saving && <span className="flex items-center gap-1 text-yellow-600">
                        <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
                        Saving...
                      </span>}
                      {!saving && code !== lastSavedRef.current && <span className="text-gray-600">Unsaved changes</span>}
                      {!saving && code === lastSavedRef.current && <span className="text-green-600 font-medium">✓ Saved</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleRunCode} 
                      disabled={executing || contestNotStarted || contestEnded || timeLeft <= 0} 
                      className="px-4 py-2 bg-gray-700 text-white rounded font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {executing && <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                      {executing ? 'Running' : '▶ Run'}
                    </button>
                    <button 
                      onClick={handleSubmitCode} 
                      disabled={submitting || contestNotStarted || contestEnded || timeLeft <= 0} 
                      className={`px-4 py-2 text-white rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                        confirmSubmit ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {submitting && <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                      {submitting ? 'Submitting' : (confirmSubmit ? '⚠️ Confirm?' : '✓ Submit')}
                    </button>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor code={code} language={language} onChange={handleCodeChange} height="100%" />
                </div>

                {/* Output Panel */}
                <div className="border-t bg-white">
                  <div className="px-6 py-3 border-b bg-gray-50 font-medium text-sm">Output</div>
                  <div className="px-6 py-4 font-mono text-sm max-h-64 overflow-y-auto">
                    {executing ? (
                      <div className="flex items-center justify-center py-8 text-gray-600">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span>Executing code…</span>
                      </div>
                    ) : output ? (
                      <div className="space-y-3">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border overflow-x-auto">
                          {output}
                        </pre>

                        {resultStatus === 'success' && (
                          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                            <strong>✓ Test passed!</strong> Your solution works for this test case.
                          </div>
                        )}

                        {resultStatus === 'failed' && (
                          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded text-sm">
                            <strong>⚠ Test failed.</strong> Review the output above to debug your solution.
                          </div>
                        )}

                        {resultStatus === 'error' && (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                            <strong>✗ Execution error.</strong> Check the output above for details.
                          </div>
                        )}

                        {testResults.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {testResults.map((test) => (
                              <div key={test.testCaseId} className={`p-3 rounded border ${
                                test.passed 
                                  ? 'bg-green-100 border-green-300' 
                                  : 'bg-red-100 border-red-300'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-medium ${
                                    test.passed ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {test.passed ? '✓ Passed' : '✗ Failed'} — Test Case {test.testNum}
                                  </span>
                                  {test.hidden && (
                                    <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Hidden</span>
                                  )}
                                </div>
                                {!test.passed && (
                                  <div className="text-xs space-y-1 mt-2">
                                    <div><strong>Input:</strong> <code className="bg-gray-100 px-1">{test.input}</code></div>
                                    <div><strong>Expected:</strong> <code className="bg-gray-100 px-1">{test.expectedOutput}</code></div>
                                    <div><strong>Got:</strong> <code className="bg-gray-100 px-1">{test.actualOutput || '(no output)'}</code></div>
                                    {test.error && <div><strong>Error:</strong> <code className="bg-red-50 px-1">{test.error}</code></div>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {timeLeft ? 'Run code to see output...' : 'Contest ended — submissions disabled'}
                      </span>
                    )}

                    {/* Linked Quiz Offer */}
                    {linkedQuizId && resultStatus === 'success' && !quizCompleted && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">🎯</span>
                              <h3 className="text-lg font-bold text-blue-900">Knowledge Check Available!</h3>
                            </div>
                            <p className="text-blue-800 text-sm mb-4">
                              Reinforce your learning with a quick quiz related to this problem. No pressure—it's completely optional!
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleOpenLinkedQuiz}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 text-sm font-bold transition-all transform hover:scale-105"
                        >
                          ✨ Take Related Quiz
                        </button>
                        <p className="text-xs text-blue-700 mt-3 text-center">
                          You can also skip this and continue to the next problem
                        </p>
                      </div>
                    )}

                    {/* Quiz Completed Badge */}
                    {linkedQuizId && quizCompleted && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg shadow-md">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">✨</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-green-900">Quiz Completed!</h3>
                            <p className="text-sm text-green-800">Great job reinforcing your knowledge!</p>
                          </div>
                          <button
                            onClick={() => setQuizCompleted(false)}
                            className="text-xs px-3 py-1 bg-white text-green-700 border border-green-400 rounded hover:bg-green-50 font-medium"
                          >
                            View Again
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Linked quiz will open inline using contest's quiz item UI. */}
                  </div>
                </div>
              </div>
            )}

            {/* Removed quiz right panel - quiz now uses full width */}
          </>
        )}
      </div>
    </div>
  );
};

export default ContestAttempt;
