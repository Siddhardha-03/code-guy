import React from 'react';

const statusStyles = {
  success: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  error: 'bg-red-100 text-red-800 border-red-300'
};

/**
 * OutputModal
 * Reusable modal for displaying run/submit results including
 * summary, per-test results, and raw logs.
 */
const OutputModal = ({
  open,
  onClose,
  mode = 'run', // 'run' | 'submit'
  status, // success | failed | error
  heading,
  summary,
  testResults = [],
  rawOutput = '',
  executing = false
}) => {
  if (!open) return null;

  const statusClass = status ? statusStyles[status] : 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{heading || (mode === 'submit' ? 'Submission Results' : 'Run Result')}</h3>
              <p className="text-xs text-blue-100">{mode === 'submit' ? 'Full test suite evaluation' : 'Single test case execution'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status / Summary */}
            <div className={`border rounded-lg p-4 ${statusClass}`}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {status === 'success' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  )}
                  {status === 'failed' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M4 6h16" />
                  )}
                  {status === 'error' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14" />
                  )}
                  {!status && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-sm">{status === 'success' ? 'Success' : status === 'failed' ? 'Failed' : status === 'error' ? 'Error' : 'Result'}</h4>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{summary || (executing ? 'Processing...' : 'No output yet.')}</p>
                </div>
              </div>
            </div>

            {/* Test Results Table */}
            {testResults.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Test Case Details</h5>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Input</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Expected</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Actual</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.map(result => (
                        <tr key={result.testCaseNumber} className="border-t">
                          <td className="px-3 py-2">{result.testCaseNumber}</td>
                          <td className="px-3 py-2 max-w-[160px] truncate" title={result.input}>{result.input || '—'}</td>
                          <td className="px-3 py-2 max-w-[160px] truncate" title={result.expectedOutput}>{result.expectedOutput || '—'}</td>
                          <td className="px-3 py-2 max-w-[160px] truncate" title={result.actualOutput || result.error}>{result.error ? 'Error' : (result.actualOutput || '—')}</td>
                          <td className="px-3 py-2">
                            {result.passed ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">PASS</span>
                            ) : result.error ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">ERROR</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">FAIL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Raw Output */}
            {rawOutput && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Raw Output</h5>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-64 whitespace-pre-wrap">{rawOutput}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">Modal will close when you click outside or press ESC.</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            disabled={executing}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutputModal;