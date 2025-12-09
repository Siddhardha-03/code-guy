import React, { useState, useEffect, useCallback } from 'react';
import { executeCode, getLanguages, getTemplate } from '../services/compilerService';
import CodeEditor from '../components/CodeEditor';

const Compiler = ({ user }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLanguages = useCallback(async () => {
    try {
      const data = await getLanguages();
      setLanguages(data);
    } catch (err) {
      setError('Failed to load supported languages.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplate = useCallback(async () => {
    try {
      const template = await getTemplate(language);
      setCode(template);
    } catch (err) {
      console.error('Failed to load template:', err);
      // Don't set error state here to avoid disrupting the UI
    }
  }, [language]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate, language]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setError('Please write some code before running.');
      return;
    }

    setError('');
    setOutput('');
    setExecuting(true);

    try {
      const result = await executeCode({
        code,
        language,
        input
      });

      // Handle different types of output from Judge0
      let outputText = '';
      
      if (result.stdout) {
        outputText = result.stdout;
      } else if (result.stderr) {
        outputText = `Error: ${result.stderr}`;
      } else if (result.compileOutput) {
        outputText = `Compilation Error: ${result.compileOutput}`;
      } else if (result.message) {
        outputText = `Message: ${result.message}`;
      } else {
        outputText = 'No output produced';
      }
      
      setOutput(outputText);
      
      // If there's an error, also set it in the error state
      if (result.stderr || result.compileOutput) {
        setError(result.stderr || result.compileOutput);
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setExecuting(false);
    }
  };

  const handleClearCode = () => {
    setCode('');
  };

  const handleClearInput = () => {
    setInput('');
  };

  const handleClearOutput = () => {
    setOutput('');
    setError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold">Online Code Compiler</h1>
        <p className="text-muted mt-1 text-sm">
          Write, run and test your code in multiple programming languages.
        </p>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Left - Code Editor */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold">Code Editor</h2>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="form-select text-sm rounded-lg"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleClearCode}
                className="btn btn-secondary btn-sm"
              >
                Clear
              </button>
              <button
                onClick={handleRunCode}
                disabled={executing}
                className="btn btn-primary btn-sm"
              >
                {executing ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Running...
                  </>
                ) : (
                  'Run Code'
                )}
              </button>
            </div>
          </div>
          
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            height="520px"
            title="Code Editor"
          />
        </div>

        {/* Right - Output with Input at Top */}
        <div className="flex flex-col gap-4">
          {/* Input Section */}
          <div className="border-premium rounded-lg overflow-hidden">
            <div className="border-b-2 border-gray-300 dark:border-gray-600 px-4 py-3">
              <h3 className="text-sm font-semibold">Input</h3>
            </div>
            <div className="p-4">
              <textarea
                value={input}
                onChange={handleInputChange}
                className="w-full h-24 font-mono text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter input for your program here..."
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="border-premium rounded-lg overflow-hidden flex flex-col flex-1">
            <div className="border-b-2 border-gray-300 dark:border-gray-600 px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold">Output</span>
              <button
                onClick={handleClearOutput}
                className="btn btn-ghost btn-sm"
              >
                Clear
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {error && (
                <div className="alert alert-danger mb-4">
                  {error}
                </div>
              )}
              
              {executing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="spinner mx-auto mb-3"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Executing your code...</span>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
                  {output || <span className="text-gray-500 dark:text-gray-400 italic">Run your code to see the output here.</span>}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compiler;